"""Domain models for Child Profile, Stage Progress, Concept Mastery, and Activity Logs."""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class ChildProfile(Base):
    __tablename__ = "child_profiles"

    id = Column(String(50), primary_key=True, default="default-child")
    name = Column(String(100), default="Little Explorer")
    avatar = Column(String(50), default="milo-bunny")
    current_world_id = Column(String(50), default="colors")
    current_stage_id = Column(String(50), default="colors-1")
    total_stars = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progresses = relationship("StageProgress", back_populates="child", cascade="all, delete-orphan")
    masteries = relationship("ConceptMastery", back_populates="child", cascade="all, delete-orphan")

class StageProgress(Base):
    __tablename__ = "stage_progresses"

    id = Column(String(100), primary_key=True)
    child_id = Column(String(50), ForeignKey("child_profiles.id"), nullable=False)
    world_id = Column(String(50), nullable=False)
    stage_id = Column(String(50), nullable=False)
    status = Column(String(30), default="locked")  # locked, unlocked, in_progress, completed
    stars = Column(Integer, default=0)              # 0 to 3
    attempts = Column(Integer, default=0)
    mistakes = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    mastery_score = Column(Float, default=0.0)      # 0.0 to 1.0
    completed_at = Column(DateTime, nullable=True)

    child = relationship("ChildProfile", back_populates="progresses")

class ConceptMastery(Base):
    __tablename__ = "concept_masteries"

    id = Column(String(100), primary_key=True)
    child_id = Column(String(50), ForeignKey("child_profiles.id"), nullable=False)
    world_id = Column(String(50), nullable=False)
    concept = Column(String(100), nullable=False)   # e.g. "red", "blue", "yellow", "green"
    mastery = Column(Float, default=0.0)            # 0.0 to 1.0
    attempts = Column(Integer, default=0)
    mistakes = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    needs_practice = Column(Boolean, default=False)
    last_practiced = Column(DateTime, default=datetime.utcnow)

    child = relationship("ChildProfile", back_populates="masteries")

class SessionLog(Base):
    __tablename__ = "session_logs"

    id = Column(String(100), primary_key=True)
    child_id = Column(String(50), nullable=False)
    stage_id = Column(String(50), nullable=False)
    concept = Column(String(100), nullable=False)
    action_type = Column(String(50), nullable=False)  # answer, hint, repeat, song, story
    is_correct = Column(Boolean, default=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
