"""Shared test setup. pytest loads this file automatically.

Every test gets a brand-new database in a temporary folder,
so tests never touch your real knowledge.db and never affect each other.
"""

import pytest
from fastapi.testclient import TestClient

from backend.db import connect, get_db, init_db
from backend.main import app


@pytest.fixture
def db(tmp_path):
    """A fresh database file, created and seeded for one test."""
    connection = connect(tmp_path / "test.db")
    init_db(connection)
    yield connection
    connection.close()


@pytest.fixture
def client(db):
    """A test client whose API uses the test database instead of the real one."""

    def get_test_db():
        yield db

    # Dependency override: wherever an endpoint asks for get_db, give it the test database
    app.dependency_overrides[get_db] = get_test_db
    yield TestClient(app)
    app.dependency_overrides.clear()
