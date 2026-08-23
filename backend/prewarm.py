import logging
from fastembed import TextEmbedding
from flashrank import Ranker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prewarm")


def prewarm_models():
    logger.info("Pre-downloading FastEmbed model: nomic-ai/nomic-embed-text-v1.5...")
    embedder = TextEmbedding(model_name="nomic-ai/nomic-embed-text-v1.5")
    list(embedder.embed(["warmup"]))
    logger.info("FastEmbed model pre-warmed successfully.")

    logger.info("Pre-downloading FlashRank model: ms-marco-TinyBERT-L-2-v2...")
    Ranker(model_name="ms-marco-TinyBERT-L-2-v2")
    logger.info("FlashRank model pre-warmed successfully.")


if __name__ == "__main__":
    prewarm_models()
