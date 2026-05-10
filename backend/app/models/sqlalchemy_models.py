from datetime import datetime, date
from typing import Optional
from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean, ForeignKey, Index, Integer, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    oauth_provider = Column(String(50), nullable=True)
    oauth_id = Column(String(255), nullable=True)
    preferences = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (Index("ix_users_email_role"),)


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True)
    key_prefix = Column(String(10), nullable=False)
    scopes = Column(JSON, default=list)
    rate_limit = Column(Integer, default=1000)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_api_keys_user_id"),
        Index("ix_api_keys_key_prefix"),
    )


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (Index("ix_organizations_slug"),)


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="member", nullable=False)
    permissions = Column(JSON, default=list)
    joined_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_org_members_org_user", "organization_id", "user_id", unique=True),
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True
    )
    settings = Column(JSON, default=dict)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_projects_owner_id"),
        Index("ix_projects_org_id"),
    )


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    url = Column(String(500), nullable=False)
    name = Column(String(255), nullable=False)
    branch = Column(String(255), default="main")
    language_stats = Column(JSON, default=dict)
    file_count = Column(Integer, default=0)
    analysis_status = Column(String(50), default="pending")
    last_analyzed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_repos_project_id"),
        Index("ix_repos_url"),
    )


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(50), default="intermediate")
    estimated_hours = Column(Integer, default=0)
    is_ai_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (Index("ix_learning_paths_project_id"),)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    learning_path_id = Column(
        UUID(as_uuid=True), ForeignKey("learning_paths.id"), nullable=False
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    difficulty = Column(String(50), default="intermediate")
    estimated_minutes = Column(Integer, default=30)
    hints = Column(JSON, default=list)
    resources = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (Index("ix_tasks_learning_path_id"),)


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    status = Column(String(50), default="not_started")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    attempts = Column(Integer, default=0)
    score = Column(Integer, nullable=True)
    time_spent_seconds = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_user_progress_user_task", "user_id", "task_id", unique=True),
        Index("ix_user_progress_status"),
    )


class AIRequest(Base):
    """Track individual AI API requests for cost monitoring and analytics."""
    
    __tablename__ = "ai_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    # Request details
    provider = Column(String(50), nullable=False)  # openai, anthropic, gemini, etc
    model = Column(String(100), nullable=False)    # gpt-4o, claude-3-5-sonnet, etc
    task_type = Column(String(50), nullable=True)  # code_review, code_generation, etc
    
    # Token counts
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    # Cost tracking
    estimated_cost = Column(Float, default=0.0)    # Estimated cost before request
    actual_cost = Column(Float, default=0.0)       # Actual cost from provider
    currency = Column(String(3), default="USD")
    
    # Status
    status = Column(String(20), default="pending")  # pending, completed, failed
    error_message = Column(Text, nullable=True)
    
    # Performance
    latency_ms = Column(Integer, nullable=True)    # Response time in milliseconds
    
    # Request/Response
    prompt_hash = Column(String(64), nullable=True)  # Hash of prompt for deduplication
    response_length = Column(Integer, default=0)
    
    # Metadata
    request_metadata = Column(JSON, default=dict)  # Custom metadata, agent name, etc
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_ai_requests_user_id"),
        Index("ix_ai_requests_project_id"),
        Index("ix_ai_requests_provider"),
        Index("ix_ai_requests_model"),
        Index("ix_ai_requests_created_at"),
        Index("ix_ai_requests_status"),
    )


class AICostSummary(Base):
    """Aggregate daily cost summaries for reporting and monitoring."""
    
    __tablename__ = "ai_cost_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    # Date
    date = Column(DateTime, nullable=False)  # Date of the summary
    
    # Cost aggregates
    total_cost = Column(Float, default=0.0)
    total_requests = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    total_input_tokens = Column(Integer, default=0)
    total_output_tokens = Column(Integer, default=0)
    
    # Provider breakdown
    cost_by_provider = Column(JSON, default=dict)  # {provider: cost}
    requests_by_provider = Column(JSON, default=dict)  # {provider: count}
    
    # Task type breakdown
    cost_by_task = Column(JSON, default=dict)  # {task_type: cost}
    requests_by_task = Column(JSON, default=dict)  # {task_type: count}
    
    # Performance metrics
    avg_latency_ms = Column(Float, nullable=True)
    success_rate = Column(Float, default=1.0)
    failed_requests = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_core_cost_summary_user_date", "user_id", "date"),
        Index("ix_ai_cost_summary_project_date", "project_id", "date"),
        Index("ix_ai_cost_summary_org_date", "organization_id", "date"),
        Index("ix_ai_cost_summary_date"),
    )


class AICostBudget(Base):
    """Define and track cost budgets for users/organizations."""
    
    __tablename__ = "ai_cost_budgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    # Budget settings
    budget_amount = Column(Float, nullable=False)  # Monthly budget in USD
    budget_period = Column(String(20), default="monthly")  # monthly, weekly, daily
    currency = Column(String(3), default="USD")
    
    # Thresholds
    warning_threshold = Column(Float, default=0.8)  # Alert at 80%
    limit_threshold = Column(Float, default=1.0)   # Enforce limit at 100%
    
    # Status
    is_active = Column(Boolean, default=True)
    enforce_limit = Column(Boolean, default=False)  # Block requests if over budget
    
    # Tracking
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, nullable=False)  # budget_amount - spent_amount
    percentage_used = Column(Float, default=0.0)
    
    # Dates
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    last_reset = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_ai_cost_budgets_user_id"),
        Index("ix_ai_cost_budgets_org_id"),
        Index("ix_ai_cost_budgets_active"),
    )


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    quiz_id = Column(UUID(as_uuid=True), nullable=False)
    score = Column(Integer, nullable=True)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    answers = Column(JSON, default=dict)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_quiz_attempts_user_id"),
        Index("ix_quiz_attempts_quiz_id"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_audit_logs_user_id"),
        Index("ix_audit_logs_action"),
        Index("ix_audit_logs_created_at"),
    )
