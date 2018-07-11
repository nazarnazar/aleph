import logging
from flask import current_app
from flask import _request_ctx_stack

from aleph import settings
from aleph.model import DocumentTagCollector
from alephclient.services.common_pb2 import Text

log = logging.getLogger(__name__)


class Analyzer(object):
    PRIORITY = 10

    def __init__(self):
        self.active = True

    def analyze(self, document):
        pass


class EntityAnalyzer(Analyzer):

    def analyze(self, document):
        if not document.supports_nlp:
            return

        collector = DocumentTagCollector(document, self.ORIGIN)
        try:
            self.extract(collector, document)
        finally:
            collector.save()

    def extract(self, collector, document):
        pass


class TextIterator(object):
    MIN_LENGTH = 100

    def text_iterator(self, document):
        # gRPC seemingly starts a non-flask thread to consume the
        # input iterable for request-iterating services. This means
        # that database queries on db.session will fail unless an
        # active request context exists for the thread. This hack
        # does this, but not via the proposed "with app.app_context()"
        # approach, which didn't always work. Instead, the request
        # context is transplanted manually. Not a proud moment.
        ctx = _request_ctx_stack.top
        return self._text_iterator(ctx, document)

    def _text_iterator(self, ctx, document):
        _request_ctx_stack.push(ctx)
        languages = list(document.languages)
        if not len(languages):
            languages = [settings.DEFAULT_LANGUAGE]
        for text in document.texts:
            if text is None or len(text) <= self.MIN_LENGTH:
                continue
            yield Text(text=text, languages=languages)
