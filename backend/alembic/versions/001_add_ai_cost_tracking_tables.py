"""Add AI cost tracking tables

Revision ID: 001
Revises: 
Create Date: 2025-01-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create AI cost tracking tables."""
    
    # Create ai_requests table
    op.create_table(
        'ai_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('task_type', sa.String(50), nullable=True),
        sa.Column('input_tokens', sa.Integer, default=0),
        sa.Column('output_tokens', sa.Integer, default=0),
        sa.Column('total_tokens', sa.Integer, default=0),
        sa.Column('estimated_cost', sa.Float, default=0.0),
        sa.Column('actual_cost', sa.Float, default=0.0),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('latency_ms', sa.Integer, nullable=True),
        sa.Column('prompt_hash', sa.String(64), nullable=True),
        sa.Column('response_length', sa.Integer, default=0),
        sa.Column('request_metadata', postgresql.JSON, default=dict),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('completed_at', sa.DateTime, nullable=True),
    )
    
    # Create indexes for ai_requests
    op.create_index('ix_ai_requests_user_id', 'ai_requests', ['user_id'])
    op.create_index('ix_ai_requests_project_id', 'ai_requests', ['project_id'])
    op.create_index('ix_ai_requests_provider', 'ai_requests', ['provider'])
    op.create_index('ix_ai_requests_model', 'ai_requests', ['model'])
    op.create_index('ix_ai_requests_created_at', 'ai_requests', ['created_at'])
    op.create_index('ix_ai_requests_status', 'ai_requests', ['status'])
    
    # Create ai_cost_summaries table
    op.create_table(
        'ai_cost_summaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('provider', sa.String(50), nullable=True),
        sa.Column('total_requests', sa.Integer, default=0),
        sa.Column('total_tokens', sa.Integer, default=0),
        sa.Column('total_cost', sa.Float, default=0.0),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('summary_metadata', postgresql.JSON, default=dict),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )
    
    # Create indexes for ai_cost_summaries
    op.create_index('ix_core_cost_summary_user_date', 'ai_cost_summaries', ['user_id', 'date'])
    op.create_index('ix_ai_cost_summary_project_date', 'ai_cost_summaries', ['project_id', 'date'])
    op.create_index('ix_ai_cost_summary_org_date', 'ai_cost_summaries', ['organization_id', 'date'])
    op.create_index('ix_ai_cost_summary_date', 'ai_cost_summaries', ['date'])
    
    # Create ai_cost_budgets table
    op.create_table(
        'ai_cost_budgets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id'), nullable=True),
        sa.Column('budget_amount', sa.Float, nullable=False),
        sa.Column('remaining_amount', sa.Float, nullable=False),
        sa.Column('currency', sa.String(3), default='USD'),
        sa.Column('period_start', sa.Date, nullable=False),
        sa.Column('period_end', sa.Date, nullable=False),
        sa.Column('alert_threshold', sa.Float, default=0.8),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )
    
    # Create indexes for ai_cost_budgets
    op.create_index('ix_ai_cost_budgets_user_id', 'ai_cost_budgets', ['user_id'])
    op.create_index('ix_ai_cost_budgets_project_id', 'ai_cost_budgets', ['project_id'])
    op.create_index('ix_ai_cost_budgets_period', 'ai_cost_budgets', ['period_start', 'period_end'])
    op.create_index('ix_ai_cost_budgets_active', 'ai_cost_budgets', ['is_active'])


def downgrade() -> None:
    """Drop AI cost tracking tables."""
    
    # Drop indexes first
    op.drop_index('ix_ai_cost_budgets_active', 'ai_cost_budgets')
    op.drop_index('ix_ai_cost_budgets_period', 'ai_cost_budgets')
    op.drop_index('ix_ai_cost_budgets_project_id', 'ai_cost_budgets')
    op.drop_index('ix_ai_cost_budgets_user_id', 'ai_cost_budgets')
    
    op.drop_index('ix_ai_cost_summary_date', 'ai_cost_summaries')
    op.drop_index('ix_ai_cost_summary_org_date', 'ai_cost_summaries')
    op.drop_index('ix_ai_cost_summary_project_date', 'ai_cost_summaries')
    op.drop_index('ix_core_cost_summary_user_date', 'ai_cost_summaries')
    
    op.drop_index('ix_ai_requests_status', 'ai_requests')
    op.drop_index('ix_ai_requests_created_at', 'ai_requests')
    op.drop_index('ix_ai_requests_model', 'ai_requests')
    op.drop_index('ix_ai_requests_provider', 'ai_requests')
    op.drop_index('ix_ai_requests_project_id', 'ai_requests')
    op.drop_index('ix_ai_requests_user_id', 'ai_requests')
    
    # Drop tables
    op.drop_table('ai_cost_budgets')
    op.drop_table('ai_cost_summaries')
    op.drop_table('ai_requests')
