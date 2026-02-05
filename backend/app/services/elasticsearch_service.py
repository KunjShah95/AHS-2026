from typing import List, Dict, Any
import aiohttp
from loguru import logger
from app.core.config import settings


class ElasticsearchClient:
    def __init__(self):
        self.url = settings.ELASTICSEARCH_URL
        self.index = settings.ELASTICSEARCH_INDEX
        self.session = None

    async def get_session(self):
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session

    async def close(self):
        if self.session:
            await self.session.close()
            self.session = None

    async def ensure_index_exists(self):
        session = await self.get_session()
        mappings = {
            "mappings": {
                "properties": {
                    "content": {"type": "text"},
                    "file_path": {"type": "keyword"},
                    "project_id": {"type": "keyword"},
                    "language": {"type": "keyword"},
                    "created_at": {"type": "date"},
                }
            },
            "settings": {"number_of_shards": 1, "number_of_replicas": 0},
        }

        try:
            async with session.put(
                f"{self.url}/{self.index}", json=mappings
            ) as response:
                if response.status not in [200, 201]:
                    logger.warning(f"Index creation response: {await response.text()}")
        except Exception as e:
            logger.error(f"Failed to ensure index: {e}")

    async def index_document(
        self, doc_id: str, content: str, file_path: str, project_id: str, language: str
    ):
        session = await self.get_session()
        doc = {
            "content": content,
            "file_path": file_path,
            "project_id": project_id,
            "language": language,
            "created_at": "2024-01-01T00:00:00",
        }

        try:
            async with session.put(
                f"{self.url}/{self.index}/_doc/{doc_id}", json=doc
            ) as response:
                if response.status not in [200, 201]:
                    logger.warning(f"Index document response: {await response.text()}")
        except Exception as e:
            logger.error(f"Failed to index document: {e}")

    async def search(
        self,
        query: str,
        project_id: Optional[str] = None,
        language: Optional[str] = None,
        size: int = 10,
    ) -> List[Dict[str, Any]]:
        session = await self.get_session()

        must = [{"match": {"content": query}}]
        if project_id:
            must.append({"term": {"project_id": project_id}})
        if language:
            must.append({"term": {"language": language}})

        search_body = {"query": {"bool": {"must": must}}, "size": size}

        try:
            async with session.post(
                f"{self.url}/{self.index}/_search", json=search_body
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    hits = result.get("hits", {}).get("hits", [])
                    return [
                        {"id": hit["_id"], "score": hit["_score"], **hit["_source"]}
                        for hit in hits
                    ]
        except Exception as e:
            logger.error(f"Search failed: {e}")
        return []

    async def delete_by_project(self, project_id: str):
        session = await self.get_session()

        try:
            async with session.post(
                f"{self.url}/{self.index}/_delete_by_query",
                json={"query": {"term": {"project_id": project_id}}},
            ) as response:
                logger.info(f"Delete by project response: {await response.text()}")
        except Exception as e:
            logger.error(f"Failed to delete by project: {e}")


es_client = ElasticsearchClient()


async def setup_elasticsearch():
    await es_client.ensure_index_exists()
