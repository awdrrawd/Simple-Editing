from pathlib import Path
import wave, math, struct, zlib, base64
d=Path(__file__).parent/'fixtures'; d.mkdir(exist_ok=True)
for name,seconds in [('tone.wav',2),('long.wav',31)]:
    with wave.open(str(d/name),'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(8000)
        w.writeframes(b''.join(struct.pack('<h', int(4000*math.sin(i*math.tau*440/8000))) for i in range(seconds*8000)))
def chunk(kind,data): return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data))
raw=b''.join(b'\0'+b''.join(bytes([x*4,y*4,120,255]) for x in range(64)) for y in range(64))
header=chunk(b'IHDR',struct.pack('>IIBBBBB',64,64,8,6,0,0,0))
(d/'sample.png').write_bytes(b'\x89PNG\r\n\x1a\n'+header+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b''))
(d/'sample.gif').write_bytes(base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'))
(d/'sample.apng').write_bytes(b'\x89PNG\r\n\x1a\n'+header+chunk(b'acTL',struct.pack('>II',2,0))+chunk(b'fcTL',struct.pack('>IIIIIHHBB',0,64,64,0,0,1,5,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'fcTL',struct.pack('>IIIIIHHBB',1,64,64,0,0,1,5,0,0))+chunk(b'fdAT',struct.pack('>I',2)+zlib.compress(raw))+chunk(b'IEND',b''))
(d/'sample.csv').write_text('name,note\nAlice,"hello, world"\n中文,"line 1\nline 2"\n',encoding='utf-8')
(d/'sample.json').write_text('[{"name":"中文","value":2}]',encoding='utf-8')
(d/'sample.txt').write_text('中文 😀 é <b>hello</b>',encoding='utf-8')
(d/'large.bin').write_bytes(bytes(range(256))*4096)
