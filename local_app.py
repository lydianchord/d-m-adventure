import os
from flask import Flask, send_from_directory

app = Flask(__name__)
site_dir = os.path.join(app.root_path, 'site')


@app.route('/', defaults={'resource': 'index.html'})
@app.route('/<path:resource>')
def get_resource(resource):
    timeout = 0 if resource.endswith('.html') else None
    return send_from_directory(site_dir, resource, cache_timeout=timeout)


if __name__ == '__main__':
    app.debug = True
    app.run()
