.PHONY: install build-index backend frontend all

install:
	pip install -r requirements.txt

build-index:
	python scripts/build_index.py

backend:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	streamlit run frontend/app.py --server.port 8501 --server.address 0.0.0.0

all:
	make build-index
	make backend & make frontend
