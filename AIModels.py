from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from sentence_transformers import SentenceTransformer

# MiniLM (run twice, save to different folders)
SentenceTransformer('all-MiniLM-L6-v2').save('./local_miniLM_model')
SentenceTransformer('all-MiniLM-L6-v2').save('./semantic_model')

# BART
tokenizer = AutoTokenizer.from_pretrained('facebook/bart-large-cnn')
model = AutoModelForSeq2SeqLM.from_pretrained('facebook/bart-large-cnn')
tokenizer.save_pretrained('./local_bart_model')
model.save_pretrained('./local_bart_model')

# Flan-T5
tokenizer = AutoTokenizer.from_pretrained('google/flan-t5-base')
model = AutoModelForSeq2SeqLM.from_pretrained('google/flan-t5-base')
tokenizer.save_pretrained('./flan-t5-local')
model.save_pretrained('./flan-t5-local')