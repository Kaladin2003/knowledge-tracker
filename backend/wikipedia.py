"""Small client for the Wikipedia REST API.

We only use one endpoint, the page summary:
    GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}
It returns the article's intro as plain text, plus an image and a link.
"""

from functools import lru_cache

import httpx

SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"

# Wikimedia asks every client to identify itself with a User-Agent and a contact.
# https://meta.wikimedia.org/wiki/User-Agent_policy
HEADERS = {"User-Agent": "KnowledgeGarden/0.1 (https://github.com/Kaladin2003/knowledge-tracker)"}


class WikipediaError(Exception):
    """Wikipedia could not be reached or answered with an error."""


class ArticleNotFound(WikipediaError):
    """No Wikipedia article with this title."""


def parse_summary(data: dict) -> dict:
    """Keep only the fields our app needs from Wikipedia's JSON."""
    return {
        "title": data.get("title", ""),
        "extract": data.get("extract", ""),
        "image": (data.get("thumbnail") or {}).get("source"),
        "url": ((data.get("content_urls") or {}).get("desktop") or {}).get("page"),
    }


@lru_cache(maxsize=256)
def fetch_summary(title: str) -> dict:
    """Download and parse the summary of one article.

    lru_cache remembers results: asking for the same title twice
    calls Wikipedia only once (until the server restarts).
    """
    url = SUMMARY_URL.format(title=title.replace(" ", "_"))
    try:
        response = httpx.get(url, headers=HEADERS, timeout=10, follow_redirects=True)
    except httpx.HTTPError as error:
        raise WikipediaError(f"Could not reach Wikipedia: {error}") from error

    if response.status_code == 404:
        raise ArticleNotFound(f"No Wikipedia article called '{title}'")
    if response.status_code != 200:
        raise WikipediaError(f"Wikipedia answered with HTTP {response.status_code}")

    return parse_summary(response.json())
