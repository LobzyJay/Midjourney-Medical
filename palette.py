from PIL import Image
import glob, colorsys, os
# Gather all keyframes + grid, downsample, quantize to a master palette
imgs = sorted(glob.glob("frames/key_*.jpg")) + sorted(glob.glob("frames/grid_*.jpg"))
master = Image.new("RGB",(120*len(imgs),120))
for i,p in enumerate(imgs):
    im=Image.open(p).convert("RGB").resize((120,120))
    master.paste(im,(120*i,0))
q=master.quantize(colors=16, method=Image.FASTOCTREE).convert("RGB")
cols=q.getcolors(120*len(imgs)*120)
cols.sort(reverse=True)
def hx(c): return "#%02X%02X%02X"%c
def lum(c): return 0.2126*c[0]+0.7152*c[1]+0.587*c[2]
print("=== DOMINANT PALETTE (by coverage) ===")
total=sum(n for n,_ in cols)
out=[]
for n,c in cols:
    h,s,v=colorsys.rgb_to_hsv(*[x/255 for x in c])
    out.append((round(100*n/total,1),hx(c),c,round(h*360),round(s*100),round(v*100)))
for pct,h,c,H,S,V in out:
    print(f"{pct:5}%  {h}  rgb{c}  HSV({H},{S}%,{V}%)")
