"""
Real-time Collaboration System for CodeGenome Wiki

Provides:
- CollabRoom: per-page editing room
- PresenceManager: SSE presence tracking with heartbeat
- CollaborationManager: orchestrates rooms, joins, leaves
- EventBus: pub/sub for broadcasting operations (in-memory MVP)
"""

import asyncio
import json
from datetime import datetime
from typing import Any, AsyncIterator, Dict, Optional
from dataclasses import dataclass, field
from collections import defaultdict
from pathlib import Path


@dataclass
class UserPresence:
    user_id: str
    user_name: str
    role: str = "editor"
    joined_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    last_heartbeat: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    cursor_pos: Optional[int] = None
    selection: Optional[Dict[str, int]] = None


@dataclass
class PresenceEvent:
    event: str
    user_id: str
    user_name: str
    page_id: str
    timestamp: str
    cursor_pos: Optional[int] = None
    selection: Optional[Dict[str, int]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event": self.event,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "page_id": self.page_id,
            "timestamp": self.timestamp,
            "cursor_pos": self.cursor_pos,
            "selection": self.selection,
        }


@dataclass
class EditOp:
    op_type: str
    content: str
    position: int
    user_id: str
    version: int
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.op_type,
            "content": self.content,
            "position": self.position,
            "user_id": self.user_id,
            "version": self.version,
            "timestamp": self.timestamp,
        }


class EventBus:
    """In-memory pub/sub event bus for broadcasting operations and presence events."""

    def __init__(self):
        self._subscribers: Dict[str, list[asyncio.Queue]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def subscribe(self, page_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            self._subscribers[page_id].append(queue)
        return queue

    async def unsubscribe(self, page_id: str, queue: asyncio.Queue):
        async with self._lock:
            if queue in self._subscribers[page_id]:
                self._subscribers[page_id].remove(queue)
                if not self._subscribers[page_id]:
                    del self._subscribers[page_id]

    async def publish(self, page_id: str, event: Dict[str, Any]):
        async with self._lock:
            queues = list(self._subscribers.get(page_id, []))

        for queue in queues:
            try:
                await queue.put(event)
            except Exception:
                pass

    async def broadcast(
        self, event: Dict[str, Any], target_page_id: Optional[str] = None
    ):
        """Broadcast event to all subscribers or specific page."""
        if target_page_id:
            await self.publish(target_page_id, event)
        else:
            async with self._lock:
                all_subscribers = {k: list(v) for k, v in self._subscribers.items()}

            for page_id, queues in all_subscribers.items():
                for queue in queues:
                    try:
                        await queue.put(event)
                    except Exception:
                        pass

    def subscriber_count(self, page_id: str) -> int:
        return len(self._subscribers.get(page_id, []))


class CollabRoom:
    """Per wiki page collaboration room."""

    def __init__(self, page_id: str, wiki_path: str = "./wiki"):
        self.page_id = page_id
        self.wiki_path = wiki_path
        self.users: Dict[str, UserPresence] = {}
        self.content: str = ""
        self.version: int = 0
        self.role: str = "shared"
        self._lock = asyncio.Lock()

    async def join(
        self, user_id: str, user_name: str, role: str = "editor"
    ) -> UserPresence:
        async with self._lock:
            presence = UserPresence(
                user_id=user_id,
                user_name=user_name,
                role=role,
            )
            self.users[user_id] = presence
            return presence

    async def leave(self, user_id: str) -> bool:
        async with self._lock:
            if user_id in self.users:
                del self.users[user_id]
                return True
            return False

    async def update_presence(
        self,
        user_id: str,
        cursor_pos: Optional[int] = None,
        selection: Optional[Dict[str, int]] = None,
    ) -> bool:
        async with self._lock:
            if user_id not in self.users:
                return False
            self.users[user_id].last_heartbeat = datetime.utcnow().isoformat()
            if cursor_pos is not None:
                self.users[user_id].cursor_pos = cursor_pos
            if selection is not None:
                self.users[user_id].selection = selection
            return True

    async def apply_op(self, op: EditOp) -> bool:
        async with self._lock:
            if op.version != self.version:
                return False

            if op.op_type == "insert":
                self.content = (
                    self.content[: op.position]
                    + op.content
                    + self.content[op.position :]
                )
            elif op.op_type == "delete":
                end_pos = min(op.position + len(op.content), len(self.content))
                self.content = self.content[: op.position] + self.content[end_pos:]

            self.version += 1
            return True

    def get_presence(self) -> list[Dict[str, Any]]:
        return [
            {
                "user_id": u.user_id,
                "user_name": u.user_name,
                "role": u.role,
                "joined_at": u.joined_at,
                "last_heartbeat": u.last_heartbeat,
                "cursor_pos": u.cursor_pos,
                "selection": u.selection,
            }
            for u in self.users.values()
        ]

    def get_content(self) -> tuple[str, int]:
        return self.content, self.version

    async def load_from_wiki(self, wiki_engine: Optional[Any] = None):
        """Load page content from wiki."""
        if wiki_engine:
            content = wiki_engine.get_page(self.page_name_to_id())
            if content:
                self.content = content

    def page_name_to_id(self) -> str:
        return self.page_id

    def id_to_page_name(self) -> str:
        return self.page_id


class PresenceManager:
    """Manages SSE presence streams per page with heartbeat tracking."""

    HEARTBEAT_INTERVAL = 15
    STALE_THRESHOLD = 45

    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self._active_streams: Dict[str, set[str]] = defaultdict(set)
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start(self):
        self._cleanup_task = asyncio.create_task(self._cleanup_stale_users())

    async def stop(self):
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass

    async def subscribe(self, page_id: str, user_id: str) -> AsyncIterator[bytes]:
        queue = await self.event_bus.subscribe(page_id)
        self._active_streams[page_id].add(user_id)

        try:
            yield self._format_sse({"event": "connected", "page_id": page_id})

            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield self._format_sse(event)
                except asyncio.TimeoutError:
                    yield self._format_sse({"event": "heartbeat"})
                except asyncio.CancelledError:
                    break
        finally:
            self._active_streams[page_id].discard(user_id)
            await self.event_bus.unsubscribe(page_id, queue)

    def _format_sse(self, data: Dict[str, Any]) -> bytes:
        return f"data: {json.dumps(data)}\n\n".encode("utf-8")

    async def broadcast_presence(
        self,
        page_id: str,
        event_type: str,
        user_id: str,
        user_name: str,
        cursor_pos: Optional[int] = None,
        selection: Optional[Dict[str, int]] = None,
    ):
        event = PresenceEvent(
            event=event_type,
            user_id=user_id,
            user_name=user_name,
            page_id=page_id,
            timestamp=datetime.utcnow().isoformat(),
            cursor_pos=cursor_pos,
            selection=selection,
        )
        await self.event_bus.publish(page_id, event.to_dict())

    async def broadcast_edit(self, page_id: str, op: Dict[str, Any]):
        await self.event_bus.publish(page_id, {"event": "edit", **op})

    async def _cleanup_stale_users(self):
        while True:
            try:
                await asyncio.sleep(self.STALE_THRESHOLD)
            except asyncio.CancelledError:
                break


class CollaborationManager:
    """Top-level orchestrator for collaboration. Owns all rooms, presence, and event bus."""

    def __init__(
        self,
        wiki_path: str = "./wiki",
        redis_url: Optional[str] = None,
    ):
        self.wiki_path = wiki_path
        self.redis_url = redis_url
        self.redis = None
        self.rooms: Dict[str, CollabRoom] = {}
        self.event_bus = EventBus()
        self.presence = PresenceManager(self.event_bus)
        self._lock = asyncio.Lock()

    async def initialize(self):
        await self.presence.start()

    async def shutdown(self):
        await self.presence.stop()

    async def join_page(
        self,
        page_id: str,
        user_id: str,
        user_name: str,
        role: str = "editor",
    ) -> Dict[str, Any]:
        async with self._lock:
            if page_id not in self.rooms:
                self.rooms[page_id] = CollabRoom(page_id, self.wiki_path)
                await self._load_page_content(page_id)

            room = self.rooms[page_id]
            presence = await room.join(user_id, user_name, role)

        await self.presence.broadcast_presence(
            page_id=page_id,
            event_type="join",
            user_id=user_id,
            user_name=user_name,
        )

        content, version = room.get_content()
        return {
            "status": "joined",
            "page_id": page_id,
            "user_id": user_id,
            "presence": presence,
            "content": content,
            "version": version,
            "collaborators": room.get_presence(),
        }

    async def leave_page(self, page_id: str, user_id: str) -> bool:
        async with self._lock:
            if page_id not in self.rooms:
                return False

            room = self.rooms[page_id]
            user_name = room.users.get(user_id, None)
            user_name_str = user_name.user_name if user_name else user_id

            result = await room.leave(user_id)

            if result:
                await self.presence.broadcast_presence(
                    page_id=page_id,
                    event_type="leave",
                    user_id=user_id,
                    user_name=user_name_str,
                )

                if not room.users:
                    del self.rooms[page_id]

            return result

    async def apply_edit(
        self,
        page_id: str,
        user_id: str,
        op_type: str,
        content: str,
        position: int,
        version: int,
    ) -> Dict[str, Any]:
        async with self._lock:
            if page_id not in self.rooms:
                return {"status": "error", "message": "Room not found"}

            room = self.rooms[page_id]

            op = EditOp(
                op_type=op_type,
                content=content,
                position=position,
                user_id=user_id,
                version=version,
            )

            success = await room.apply_op(op)

            if success:
                new_content, new_version = room.get_content()
                await self.presence.broadcast_edit(
                    page_id,
                    {
                        "op": op.to_dict(),
                        "new_version": new_version,
                        "user_id": user_id,
                    },
                )
                return {
                    "status": "applied",
                    "version": new_version,
                    "content": new_content,
                }
            else:
                return {
                    "status": "conflict",
                    "message": "Version mismatch",
                    "current_version": room.version,
                    "current_content": room.content,
                }

    async def update_presence(
        self,
        page_id: str,
        user_id: str,
        cursor_pos: Optional[int] = None,
        selection: Optional[Dict[str, int]] = None,
    ):
        async with self._lock:
            if page_id not in self.rooms:
                return False

            room = self.rooms[page_id]
            user = room.users.get(user_id)
            if not user:
                return False

            success = await room.update_presence(user_id, cursor_pos, selection)
            if success:
                await self.presence.broadcast_presence(
                    page_id=page_id,
                    event_type="cursor",
                    user_id=user_id,
                    user_name=user.user_name,
                    cursor_pos=cursor_pos,
                    selection=selection,
                )
            return success

    async def get_page_content(self, page_id: str) -> Dict[str, Any]:
        async with self._lock:
            if page_id not in self.rooms:
                return {"status": "error", "message": "Room not found"}

            room = self.rooms[page_id]
            content, version = room.get_content()
            return {
                "status": "ok",
                "page_id": page_id,
                "content": content,
                "version": version,
            }

    async def get_collaborators(self, page_id: str) -> Dict[str, Any]:
        async with self._lock:
            if page_id not in self.rooms:
                return {"status": "no_room", "page_id": page_id, "collaborators": []}

            room = self.rooms[page_id]
            return {
                "status": "ok",
                "page_id": page_id,
                "collaborators": room.get_presence(),
                "count": len(room.users),
            }

    async def get_all_active_pages(self) -> Dict[str, Any]:
        async with self._lock:
            return {
                "active_pages": [
                    {
                        "page_id": page_id,
                        "collaborator_count": len(room.users),
                        "users": [
                            {"user_id": u.user_id, "user_name": u.user_name}
                            for u in room.users.values()
                        ],
                    }
                    for page_id, room in self.rooms.items()
                    if room.users
                ]
            }

    async def save_page(self, page_id: str) -> Dict[str, Any]:
        async with self._lock:
            if page_id not in self.rooms:
                return {"status": "error", "message": "Room not found"}

            room = self.rooms[page_id]
            content, _ = room.get_content()

            page_path = Path(self.wiki_path) / f"{page_id}.md"
            page_path.parent.mkdir(parents=True, exist_ok=True)
            page_path.write_text(content, encoding="utf-8")

            return {"status": "saved", "page_id": page_id}

    async def _load_page_content(self, page_id: str):
        if page_id not in self.rooms:
            return

        room = self.rooms[page_id]
        page_path = Path(self.wiki_path) / f"{page_id}.md"

        if page_path.exists():
            room.content = page_path.read_text(encoding="utf-8")

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "active_rooms": len(self.rooms),
            "total_collaborators": sum(len(room.users) for room in self.rooms.values()),
            "event_bus_subscribers": sum(
                self.event_bus.subscriber_count(page_id) for page_id in self.rooms
            ),
        }


_collab_manager: Optional[CollaborationManager] = None


def get_collaboration_manager(
    wiki_path: str = "./wiki", redis_url: Optional[str] = None
) -> CollaborationManager:
    global _collab_manager
    if _collab_manager is None:
        _collab_manager = CollaborationManager(wiki_path, redis_url)
    return _collab_manager


async def init_collaboration(wiki_path: str = "./wiki") -> CollaborationManager:
    manager = get_collaboration_manager(wiki_path)
    await manager.initialize()
    return manager
