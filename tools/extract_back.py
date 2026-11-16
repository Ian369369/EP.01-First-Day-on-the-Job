"""Extract the official BACK view (turnaround sheet) as the head_back rig sprite, upscaled to match head_front."""
import cv2, numpy as np, json
im=cv2.imread('assets/reference/moonboy_turnaround_official.png')
x0,y0,x1,y1=846,26,1146,266
crop=im[y0:y1,x0:x1]
F=2.705
big=cv2.resize(crop,None,fx=F,fy=F,interpolation=cv2.INTER_LANCZOS4)
bl=cv2.GaussianBlur(big,(0,0),2.2); big=cv2.addWeighted(big,1.9,bl,-0.9,0)   # unsharp to firm up ink lines
big=cv2.bilateralFilter(big,7,28,5)
h,w=big.shape[:2]; yy,xx=np.mgrid[0:h,0:w]
CX,CY,R=(993.5-x0)*F,(147-y0)*F,105.5*F
circle=((xx-CX)**2+(yy-CY)**2<=R*R).astype(np.uint8)
E=lambda k:cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(k,k))
bright=(big.max(axis=2)>50).astype(np.uint8)*(1-circle)
box=np.zeros_like(bright); box[int((128-y0)*F):int((197-y0)*F),:]=1
ring=cv2.morphologyEx(bright*box,cv2.MORPH_CLOSE,E(11)); ring=cv2.morphologyEx(ring,cv2.MORPH_OPEN,E(7)); ring=cv2.dilate(ring,E(3))
head=np.clip(circle+ring,0,1).astype(np.uint8)
n,lab=cv2.connectedComponents(head,8); head=(lab==lab[int(CY),int(CX)]).astype(np.uint8)
ad=cv2.dilate(head,E(7)); col=big.copy(); col[(ad==1)&(head==0)]=0
af=cv2.GaussianBlur(ad.astype(np.float32),(0,0),0.9)
ys,xs=np.where(af>0.01); a,b,c,d=xs.min(),xs.max()+1,ys.min(),ys.max()+1
cv2.imwrite('assets/character/head_back.png',np.dstack([col[c:d,a:b],(af[c:d,a:b]*255).astype(np.uint8)]))
P=json.load(open('assets/character/parts.json'))
P['parts']['head_back']={'w':int(b-a),'h':int(d-c),'ax':float(CX-a),'ay':float(CY-c),'r':float(R)}
json.dump(P,open('assets/character/parts.json','w'),indent=1); print(P['parts']['head_back'])
