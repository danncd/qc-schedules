import unittest
from io import BytesIO
from unittest.mock import patch

from scripts.sources import topic_titles


class TopicSourceTests(unittest.TestCase):
    def test_discovery_preserves_years(self):
        html = b'<a name="schedule"></a><ol><li><a href="sp26/sp26.pdf">Spring 2026</a></li><li><a href="sp27/sp27.pdf">Spring 2027</a></li></ol>'
        with patch.object(
            topic_titles.urllib.request, "urlopen", return_value=BytesIO(html)
        ):
            documents = topic_titles.discover_schedule_pdfs()
        self.assertEqual([document.year for document in documents], [2026, 2027])

    def test_discovery_rejects_conflicting_years(self):
        html = b'<a name="schedule"></a><ol><li><a href="sp27.pdf">Spring 2026</a></li></ol>'
        with patch.object(
            topic_titles.urllib.request, "urlopen", return_value=BytesIO(html)
        ):
            with self.assertRaisesRegex(ValueError, "Conflicting years"):
                topic_titles.discover_schedule_pdfs()

    def test_only_matching_documents_are_downloaded_once(self):
        document = topic_titles.SchedulePDF(
            "spring", 2026, "https://example.com/sp26.pdf"
        )
        unrelated = topic_titles.SchedulePDF(
            "spring", 2027, "https://example.com/sp27.pdf"
        )
        with patch.object(
            topic_titles,
            "discover_schedule_pdfs",
            return_value=[document, document, unrelated],
        ), patch.object(
            topic_titles, "parse_cs_schedule_pdf", return_value=[]
        ) as parse:
            topic_titles.fetch_topic_courses({("spring", 2026)})
            parse.assert_called_once_with(document.url)

    def test_optional_discovery_failure_keeps_pipeline_available(self):
        with patch.object(
            topic_titles,
            "discover_schedule_pdfs",
            side_effect=ValueError("unavailable"),
        ):
            self.assertEqual(topic_titles.fetch_topic_courses({("spring", 2026)}), {})
