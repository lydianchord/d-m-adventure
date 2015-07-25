import os
import unittest

import local_app


class SiteTestCase(unittest.TestCase):
    
    def setUp(self):
        local_app.app.config['TESTING'] = True
        self.app = local_app.app.test_client()
        self.site_files = [x for x in os.listdir(os.path.join(os.path.dirname(__file__), 'site'))
                           if not x.startswith('google') and not x.startswith('_')]
    
    def tearDown(self):
        pass
    
    def test_get_all_resources(self):
        assert len(self.site_files)
        for f in self.site_files:
            with self.app.get(f, follow_redirects=True) as resp:
                assert resp.status_code == 200, '%s %s' % (f, resp.status_code)
                if f.endswith('.html'):
                    data = str(resp.get_data())
                    assert '<!DOCTYPE html>' in data, '%s\n%s' % (f, data)
                    assert 'href="about.html"' in data, '%s\n%s' % (f, data)
    
    def test_not_filename(self):
        with self.app.get('index') as resp:
            assert resp.status_code == 404, resp.status_code
    
    def test_nonexistent_path(self):
        with self.app.get('site/index.html') as resp:
            assert resp.status_code == 404, resp.status_code


if __name__ == '__main__':
    unittest.main()
