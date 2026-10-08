import asyncio,aiohttp,json,os,sys
HI=50006646; N=1_000_000; LO=HI-N+1; CH=50_000
async def main():
    s=aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit=120),timeout=aiohttp.ClientTimeout(total=30))
    sem=asyncio.Semaphore(120)
    async def g(i):
        for a in range(6):
            try:
                async with sem:
                    async with s.get(f"https://hacker-news.firebaseio.com/v0/item/{i}.json") as r:
                        return i,await r.json()
            except Exception: await asyncio.sleep(1+a)
        return i,"ERR"
    for st in range(LO,HI+1,CH):
        fn=f"raw/items_{st}_{min(st+CH-1,HI)}.jsonl"
        if os.path.exists(fn): continue
        res=await asyncio.gather(*[g(i) for i in range(st,min(st+CH,HI+1))])
        with open(fn+".tmp","w") as f:
            for i,x in res:
                f.write(json.dumps(x if x not in(None,"ERR") else {"id":i,"missing":x is None,"error":x=="ERR"},separators=(",",":"))+"\n")
        os.rename(fn+".tmp",fn); print(fn,flush=True)
    await s.close()
asyncio.run(main())
