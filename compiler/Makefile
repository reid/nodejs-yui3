all: files source

source:
	node-waf configure build

files: clean
	./scripts/fetch_source.js
	make sync

sync:
	cat ../lib/* >> ./src/lib/nodejs_yui3.js
	cp ./src/yui.js ./src/lib/

clean:
	./scripts/clean.sh
