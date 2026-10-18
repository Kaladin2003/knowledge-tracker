"""Tests for the Wikipedia client.

The real Wikipedia is never called: tests must work offline and give
the same result every time. monkeypatch swaps httpx.get for a fake.
"""

import httpx
import pytest

from backend import wikipedia
from backend.wikipedia import ArticleNotFound, WikipediaError, fetch_summary, parse_summary

# A trimmed copy of a real Wikipedia summary response
SAMPLE = {
    "type": "standard",
    "title": "Bicycle frame",
    "extract": "A bicycle frame is the main component of a bicycle.",
    "thumbnail": {"source": "https://upload.wikimedia.org/frame.jpg", "width": 320, "height": 200},
    "content_urls": {"desktop": {"page": "https://en.wikipedia.org/wiki/Bicycle_frame"}},
}


@pytest.fixture(autouse=True)
def empty_cache():
    """lru_cache would keep results between tests, so clear it before each one."""
    fetch_summary.cache_clear()


def fake_get(status_code, json_data=None):
    """Build a replacement for httpx.get that returns a fixed response."""
    def _get(url, **kwargs):
        return httpx.Response(status_code, json=json_data, request=httpx.Request("GET", url))
    return _get


def test_parse_summary_keeps_needed_fields():
    assert parse_summary(SAMPLE) == {
        "title": "Bicycle frame",
        "extract": "A bicycle frame is the main component of a bicycle.",
        "image": "https://upload.wikimedia.org/frame.jpg",
        "url": "https://en.wikipedia.org/wiki/Bicycle_frame",
    }


def test_parse_summary_without_image():
    data = {**SAMPLE}
    del data["thumbnail"]

    assert parse_summary(data)["image"] is None


def test_fetch_summary_success(monkeypatch):
    monkeypatch.setattr(wikipedia.httpx, "get", fake_get(200, SAMPLE))

    assert fetch_summary("Bicycle frame")["title"] == "Bicycle frame"


def test_fetch_summary_uses_underscores_and_user_agent(monkeypatch):
    calls = []

    def recording_get(url, **kwargs):
        calls.append((url, kwargs))
        return httpx.Response(200, json=SAMPLE, request=httpx.Request("GET", url))

    monkeypatch.setattr(wikipedia.httpx, "get", recording_get)
    fetch_summary("Bicycle frame")

    url, kwargs = calls[0]
    assert url.endswith("/page/summary/Bicycle_frame")
    assert "KnowledgeGarden" in kwargs["headers"]["User-Agent"]


def test_fetch_summary_is_cached(monkeypatch):
    calls = []

    def counting_get(url, **kwargs):
        calls.append(url)
        return httpx.Response(200, json=SAMPLE, request=httpx.Request("GET", url))

    monkeypatch.setattr(wikipedia.httpx, "get", counting_get)
    fetch_summary("Bicycle frame")
    fetch_summary("Bicycle frame")

    assert len(calls) == 1


def test_fetch_summary_not_found(monkeypatch):
    monkeypatch.setattr(wikipedia.httpx, "get", fake_get(404, {"title": "Not found."}))

    with pytest.raises(ArticleNotFound):
        fetch_summary("No such article")


def test_fetch_summary_server_error(monkeypatch):
    monkeypatch.setattr(wikipedia.httpx, "get", fake_get(503))

    with pytest.raises(WikipediaError):
        fetch_summary("Bicycle frame")


def test_fetch_summary_network_down(monkeypatch):
    def broken_get(url, **kwargs):
        raise httpx.ConnectError("no internet")

    monkeypatch.setattr(wikipedia.httpx, "get", broken_get)

    with pytest.raises(WikipediaError):
        fetch_summary("Bicycle frame")
