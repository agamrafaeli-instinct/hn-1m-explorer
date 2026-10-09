"""Word lists for the weekly snapshot (schema v2). One place to change them; a change is a code change with a test.
Every snapshot records LIST_VERSION. Matching is whole words, case-insensitive, on text split into [a-z0-9_] words,
which is the same as a regex \\b match. Stories: title plus text. Comments: text. A phrase is matched as lowercase text.
See docs/WEEKLY_SPEC.md for what each list is for and its limits."""
LIST_VERSION = '1'

def T(words=(), phrases=()): return {'words': tuple(words), 'phrases': tuple(phrases)}

# AI words. CORE is the union used for "AI share". BASELINE terms are the ones that reproduce data/history/terms_daily.csv.
AI_CORE = T(['ai', 'llm', 'llms', 'chatgpt', 'gpt', 'openai', 'claude', 'copilot', 'anthropic', 'gemini'])
BASELINE = {
    'ai': T(['ai']), 'llm': T(['llm', 'llms']), 'chatgpt': T(['chatgpt']), 'gpt': T(['gpt']), 'openai': T(['openai']),
    'claude': T(['claude']), 'copilot': T(['copilot']), 'rust': T(['rust']), 'python': T(['python']), 'remote': T(['remote']),
}
LANGUAGES = {'rust': T(['rust']), 'python': T(['python']), 'typescript': T(['typescript']), 'javascript': T(['javascript']),
             'java': T(['java']), 'swift': T(['swift']), 'zig': T(['zig']), 'cpp': T(phrases=['c++']), 'kotlin': T(['kotlin'])}
TOOLS = {'postgres': T(['postgres', 'postgresql']), 'sqlite': T(['sqlite']), 'docker': T(['docker']), 'kubernetes': T(['kubernetes', 'k8s']),
         'linux': T(['linux']), 'git': T(['git']), 'vscode': T(['vscode'], ['vs code']), 'neovim': T(['neovim', 'nvim']),
         'react': T(['react']), 'wasm': T(['wasm', 'webassembly'])}
AI_CODING = {'claude_code': T(phrases=['claude code']), 'cursor': T(['cursor']), 'mcp': T(['mcp']), 'copilot': T(['copilot']),
             'agentic': T(['agentic']), 'ai_agents': T(phrases=['ai agent'])}
# Deep-tech themes: the old deeptech word list in scripts/terms.py, split. Titles only (same as the baskets).
THEMES = {
    'quantum': T(['quantum', 'qubit', 'qubits']),
    'fusion_fission': T(['fusion', 'fission', 'tokamak', 'reactor']),
    'chips': T(['semiconductor', 'semiconductors', 'lithography', 'fpga', 'asic'], ['risc-v']),
    'batteries': T(['battery', 'batteries'], ['solid-state']),
    'bio': T(['crispr', 'mrna'], ['gene editing', 'synthetic biology']),
    'photonics_lidar': T(['photonic', 'photonics', 'lidar', 'neuromorphic', 'perovskite', 'superconductor', 'superconductors', 'superconducting', 'superconductivity']),
    'data_center': T(phrases=['data center', 'data centre']),
    'gpu': T(['gpu', 'gpus']),
    'robotics': T(['robot', 'robots', 'robotics']),
    'solar': T(['solar']),
}
AI_INFRA = T(['gpu', 'gpus', 'nvidia', 'tpu', 'tpus'], ['data center', 'data centre'])
DEAL_WORDS = {'raises': T(['raises', 'raised']), 'series': T(phrases=['series a', 'series b', 'series c', 'series d', 'series e', 'seed round']),
              'funding': T(['funding', 'funded']), 'acquisition': T(['acquires', 'acquired', 'acquisition']), 'ipo': T(['ipo']),
              'valuation': T(['valuation']), 'bankrupt': T(['bankrupt', 'bankruptcy']), 'layoffs': T(['layoffs'], ['laid off']),
              'shutdown': T(phrases=['shuts down', 'shutting down', 'shut down'])}
# Starter watchlist for deep-tech VCs. The owner is to replace it with their own names. Matched in titles.
# Names that are also common words are matched only when capitalised (see CASE_SENSITIVE).
WATCHLIST = ['OpenAI', 'Anthropic', 'Nvidia', 'Google', 'Meta', 'Microsoft', 'Apple', 'Amazon', 'Tesla', 'SpaceX', 'xAI', 'DeepSeek',
             'Mistral', 'Intel', 'AMD', 'TSMC', 'Cloudflare', 'Stripe', 'Palantir', 'Figma', 'Vercel', 'Supabase', 'Hugging Face',
             'Perplexity', 'Rocket Lab', 'Anduril', 'Cerebras']
CASE_SENSITIVE = {'Meta', 'Apple', 'Amazon', 'Intel'}
PRESS = ['techcrunch.com', 'bloomberg.com', 'reuters.com', 'wsj.com', 'ft.com', 'nytimes.com', 'economist.com', 'theinformation.com',
         'wired.com', 'theverge.com', 'arstechnica.com', 'cnbc.com', 'forbes.com', 'businessinsider.com', 'theregister.com', 'bbc.com',
         'theguardian.com', 'washingtonpost.com', 'axios.com', 'fortune.com']
PRIMARY = ['arxiv.org', 'nature.com', 'science.org', 'github.com', 'acm.org', 'ieee.org', 'biorxiv.org', 'openai.com', 'anthropic.com',
           'blog.google', 'research.google', 'huggingface.co', 'nasa.gov']
READING = {'youtube': ['youtube.com', 'youtu.be'], 'wikipedia': ['en.wikipedia.org']}
# Hiring-style comment: first line holds at least two "|" separated fields. An estimate, not an exact thread count.
HIRING_SKILLS = {'ai_ml': T(['ai', 'ml', 'llm']), 'python': T(['python']), 'rust': T(['rust']), 'typescript': T(['typescript', 'react']),
                 'backend': T(['backend'], ['back-end']), 'remote': T(['remote']), 'onsite': T(['onsite'], ['on-site'])}
