import os
from flask import Flask, send_from_directory

app = Flask(__name__)
site_dir = os.path.join(app.root_path, 'site')

@app.route('/', defaults={'resource': 'index.html'})
@app.route('/<resource>')
def get_resource(resource):
    return send_from_directory(site_dir, resource)

if __name__ == '__main__':
    app.debug = True
    app.run()
