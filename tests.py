import os
import re
import unittest
from eventlet import GreenPool
from eventlet.green.urllib import request as eventlet_request
from lxml import html

import local_app


class SiteTestCase(unittest.TestCase):
    
    def external_assert_status_code_200(self, url):
        try:
            with eventlet_request.urlopen(url) as resp:
                self.assertEqual(resp.getcode(), 200, url)
        except:
            print(url)
            raise
        return True
    
    @classmethod
    def setUpClass(cls):
        root = local_app.app.root_path
        cls.site_html = set('/' + x for x in os.listdir(os.path.join(root, 'templates'))
                            if not x.startswith('_'))
        cls.site_assets = set('/assets/' + x for x in os.listdir(os.path.join(root, 'site', 'assets'))
                              if not x.startswith('_') and not x.endswith('.html'))
        cls.pool = GreenPool()
    
    def setUp(self):
        local_app.app.config['TESTING'] = True
        self.app = local_app.app.test_client()
    
    def test_request_index(self):
        with self.app.head('/') as resp:
            self.assertEqual(resp.status_code, 200)
    
    def test_request_html(self):
        self.assertGreater(len(self.site_html), 0)
        for f in self.site_html:
            with self.app.get(f, follow_redirects=True) as resp:
                self.assertEqual(resp.status_code, 200, f)
                data = resp.get_data(as_text=True)
            self.assertIn('<!DOCTYPE html>', data, f)
            self.assertIn('href="/about.html"', data, f)
    
    def test_request_assets(self):
        self.assertGreater(len(self.site_assets), 0)
        for f in self.site_assets:
            with self.app.head(f) as resp:
                self.assertEqual(resp.status_code, 200, f)
    
    def test_crawl_links(self):
        plain_text = {'html', 'js', 'css'}
        unvisited_html = self.site_html.copy()
        unvisited_assets = self.site_assets.copy()
        visited_external = set()
        bad_routes = []
        def crawl(page):
            with self.app.get(page, follow_redirects=True) as resp:
                self.assertEqual(resp.status_code, 200, page)
                if page.rsplit('.', 1)[-1] in plain_text:
                    data = resp.get_data(as_text=True)
                else:
                    data = None
            if page in unvisited_html:
                unvisited_html.remove(page)
                tree = html.fromstring(data)
                links = []
                external_links = []
                for result in tree.iterlinks():
                    link = result[2]
                    base_link = link.split('?', 1)[0]
                    if base_link not in self.site_html | self.site_assets and link not in visited_external:
                        if 'javascript:' not in link and '.ico' not in link:
                            if '//' in link:
                                visited_external.add(link)
                                if link[:2] == '//':
                                    link = 'https:' + link
                                external_links.append(link)
                            else:
                                bad_routes.append((page, link))
                    elif base_link in unvisited_html or base_link in unvisited_assets:
                        links.append(base_link)
                if external_links:
                    feedback = self.pool.imap(self.external_assert_status_code_200, external_links)
                    self.assertGreater(len([x for x in feedback]), 0)
                for link in links:
                    crawl(link)
            elif page in unvisited_assets:
                unvisited_assets.remove(page)
                if data:
                    resources = (re.findall(r'"\S+?\.png"', data)
                                 + re.findall(r'"\S+?\.json"', data))
                    for resource in resources:
                        resource = resource[1:-1]
                        if resource not in self.site_assets:
                            bad_routes.append((page, link))
                        elif resource in unvisited_assets:
                            crawl(resource)
        crawl('/index.html')
        # should be no unused resources and no poorly formed links
        self.assertEqual(len(unvisited_html), 0, unvisited_html)
        self.assertEqual(len(unvisited_assets), 0, unvisited_assets)
        self.assertEqual(len(bad_routes), 0, bad_routes)
    
    def test_request_non_filename(self):
        with self.app.head('/index') as resp:
            self.assertEqual(resp.status_code, 404)
    
    def test_request_nonexistent_path(self):
        with self.app.head('/site/index.html') as resp:
            self.assertEqual(resp.status_code, 404)


if __name__ == '__main__':
    unittest.main(verbosity=2)
