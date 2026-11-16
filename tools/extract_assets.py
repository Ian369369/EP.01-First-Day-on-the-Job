"""Cut the OFFICIAL MOONBOY artwork into reusable cut-out rig parts.
No pixels are redrawn by AI: every sprite is a crop of the supplied reference,
with an alpha matte + cel outline. Outputs assets/character/*.png + parts.json."""
import cv2, numpy as np, json, os
SRC='assets/reference/moonboy_front_official.png'
OUT='assets/character'
im=cv2.imread(SRC); H,W=im.shape[:2]
lum=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
yy,xx=np.mgrid[0:H,0:W]
CX,CY,R=672,448,284
circle=((xx-CX)**2+(yy-CY)**2<=(R+1)**2).astype(np.uint8)
E=lambda k:cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(k,k))
parts={}

def save(name,alpha,rgb=None,anchor=None,outline=3,extra=None):
    """alpha: uint8 0/1 full-frame mask. Adds black cel outline, crops, saves RGBA."""
    rgb=im if rgb is None else rgb
    a=alpha.astype(np.uint8)
    if outline:
        ad=cv2.dilate(a,E(2*outline+1))
        col=rgb.copy(); col[(ad==1)&(a==0)]=0
    else: ad=a; col=rgb
    af=cv2.GaussianBlur(ad.astype(np.float32),(0,0),0.9)
    ys,xs=np.where(af>0.01); x0,x1,y0,y1=xs.min()-2,xs.max()+3,ys.min()-2,ys.max()+3
    rgba=np.dstack([col[y0:y1,x0:x1],(np.clip(af[y0:y1,x0:x1],0,1)*255).astype(np.uint8)])
    cv2.imwrite(f'{OUT}/{name}.png',rgba)
    ax,ay=anchor if anchor else (CX,CY)
    parts[name]={'w':int(x1-x0),'h':int(y1-y0),'ax':float(ax-x0),'ay':float(ay-y0)}
    if extra: parts[name].update(extra)

# ---------- HEAD UNIT = moon body + chrome ring (kept as ONE piece so the ring can never drift)
bright=(im.max(axis=2)>45).astype(np.uint8)
outside=bright*(1-circle)
cl=cv2.morphologyEx(outside,cv2.MORPH_CLOSE,E(9))
op=cv2.morphologyEx(cl,cv2.MORPH_OPEN,E(9))
n,lab,st,cen=cv2.connectedComponentsWithStats(op,8)
ring=np.zeros_like(op)
for i in range(1,n):
    x,y,w,h,a=st[i]
    left = x<420 and 540<y<720 and x+w<700 and y+h<725 and a>1500
    right= x>880 and 380<y<600 and x+w>1000
    if left or right: ring[lab==i]=1; print('ring comp',st[i])
ring=cv2.dilate(ring,E(3))
head=np.clip(circle+ring,0,1).astype(np.uint8)
# drop anything not connected to the body
n,lab=cv2.connectedComponents(head,8); head=(lab==lab[CY,CX]).astype(np.uint8)
save('head_front',head,extra={'r':R})

# ---------- face features
dark=(lum<110).astype(np.uint8)
inside=((xx-CX)**2+(yy-CY)**2<(R-14)**2).astype(np.uint8)
n,lab,st,cen=cv2.connectedComponentsWithStats(dark*inside,8)
def comp_at(bx,by):
    # select the dark component whose bbox origin is nearest (bx,by)
    i=1+int(np.argmin(np.abs(st[1:,0]-bx)+np.abs(st[1:,1]-by)+(st[1:,4]<150)*9999)); return (lab==i).astype(np.uint8)
def filled(m):
    cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    o=np.zeros_like(m); cv2.drawContours(o,cs,-1,1,-1); return o
feat={'brow_l':comp_at(484,223),'brow_r':comp_at(649,223),'eye_l':comp_at(460,280),'eye_r':comp_at(602,280),
      'nose':comp_at(503,412),'cheek_r':comp_at(703,428),'mouth':comp_at(429,447)}
feat={k:filled(v) for k,v in feat.items()}
allf=np.zeros_like(dark)
for k,m in feat.items():
    md=cv2.dilate(m,E(5)); allf|=md
    ys,xs=np.where(m>0)
    anc=((xs.min()+xs.max())/2,(ys.min()+ys.max())/2)
    save(k,md,anchor=anc,outline=0,extra={'ox':anc[0]-CX,'oy':anc[1]-CY})
# blank face by inpainting ivory over the features (ring outlines protected)
ringdark=np.zeros_like(dark)
for i in range(1,n):
    x,y,w,h,a=st[i]
    if w>350 and y>430 and not (x==429 and y==447): ringdark[lab==i]=1
maskf=cv2.dilate(allf,E(9))&(1-cv2.dilate(ringdark,E(5)))
blank=cv2.inpaint(im,(maskf*255).astype(np.uint8),7,cv2.INPAINT_TELEA)
blank=cv2.bilateralFilter(blank,9,30,9)*maskf[...,None]+blank*(1-maskf[...,None])
save('head_front_blank',head,rgb=blank.astype(np.uint8),extra={'r':R})

# ---------- gloves / shoes
op2=cv2.morphologyEx((im.max(axis=2)>70).astype(np.uint8),cv2.MORPH_OPEN,E(11))
n2,lab2,st2,_=cv2.connectedComponentsWithStats(op2,8)
def c2(px,py):
    i=lab2[py,px]
    if i==0:
        d=(xx-px)**2+(yy-py)**2+(lab2==0)*10**9; j=np.unravel_index(np.argmin(d),d.shape); i=lab2[j]
    return (lab2==i).astype(np.uint8)
def hull(m):
    pts=cv2.findNonZero(m); h=cv2.convexHull(pts); o=np.zeros_like(m); cv2.fillConvexPoly(o,h,1); return o
fist=filled(cv2.morphologyEx(c2(250,330)|c2(360,360),cv2.MORPH_CLOSE,E(15)))
save('fist',cv2.dilate(fist,E(5)),anchor=(335,410))
glove=filled(cv2.morphologyEx(c2(930,760),cv2.MORPH_CLOSE,E(9)))
save('glove',cv2.dilate(glove,E(5)),anchor=(905,690))
# standing shoe: dome + sole band (+ thin rim line of the black dome), and ankle cuff
cuff=c2(760,835)
thin=((im.max(axis=2)>70)).astype(np.uint8); roi=np.zeros_like(thin); roi[862:965,690:870]=1
thin=thin*roi*(1-cv2.dilate(cuff,E(21)))
shoe=hull(c2(650,920)|c2(700,990)|thin)
shoe=shoe|filled(cv2.morphologyEx(cuff,cv2.MORPH_CLOSE,E(9)))
shoe=filled(cv2.morphologyEx(shoe,cv2.MORPH_CLOSE,E(25)))
save('shoe',cv2.dilate(shoe,E(5)),anchor=(748,828))
sole=hull(c2(300,800)|c2(400,880))
solecuff=filled(cv2.morphologyEx(c2(520,800),cv2.MORPH_CLOSE,E(9)))
save('shoe_sole',cv2.dilate(sole|hull(solecuff|(sole&0)),E(5)),anchor=(545,790))
json.dump({'body':{'cx':CX,'cy':CY,'r':R},'parts':parts},open(f'{OUT}/parts.json','w'),indent=1)
print(json.dumps(parts))
