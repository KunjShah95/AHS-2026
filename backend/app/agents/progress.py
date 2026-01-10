from typing import Dict, List

class ProgressAgent:
    """
    Agent 7: Progress & Feedback
    Tracks user status (InMemory for V0).
    """
    def __init__(self):
        self.user_progress = {} # {user_id: {completed_tasks: []}}

    def mark_task_complete(self, user_id: str, task_id: str):
        if user_id not in self.user_progress:
            self.user_progress[user_id] = {"completed_tasks": []}
        
        if task_id not in self.user_progress[user_id]["completed_tasks"]:
            self.user_progress[user_id]["completed_tasks"].append(task_id)

    def get_progress(self, user_id: str) -> Dict:
        return self.user_progress.get(user_id, {"completed_tasks": []})
