import unittest
from pathlib import Path

class ExplorerLoadMeasure(unittest.TestCase):
    def test_completion_and_diagnostics(self):
        s = Path('scripts/measure_explorer_load.mjs').read_text()
        self.assertIn('!busy&&loadedSize>0', s)
        for field in ['ready_ms:', 'load_ms:', 'csvBytes', 'complete', 'files:', 'posts:', 'status:']:
            self.assertIn(field, s)
        self.assertIn('complete=false', s)
        self.assertIn("arg('out'", s)

    def test_workflow_keeps_shell_budgets_and_artifact(self):
        s = Path('.github/workflows/daily-hn.yml').read_text()
        self.assertIn('node scripts/perf.mjs --serve _site --runs 3', s)
        self.assertIn('node scripts/measure_explorer_load.mjs default --serve _site', s)
        self.assertIn('name: explorer-data-load', s)
        self.assertIn('continue-on-error: true', s.split('Measure actual Explorer data load')[1].split('Save the build state')[0])
