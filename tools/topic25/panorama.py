"""Project authored walls into the standard Revise360 equirectangular panorama."""
import numpy as np
from PIL import Image

def panorama(faces,width):
 height=width//2;out=np.empty((height,width,3),dtype=np.uint8)
 arrays={k:np.asarray(v)for k,v in faces.items()}
 lon=(np.arange(width,dtype=np.float32)+.5)/width*2*np.pi-np.pi
 for start in range(0,height,128):
  lat=np.pi/2-(np.arange(start,min(height,start+128),dtype=np.float32)+.5)/height*np.pi
  X=np.cos(lat[:,None])*np.sin(lon[None,:]);Z=np.cos(lat[:,None])*np.cos(lon[None,:]);Y=np.broadcast_to(np.sin(lat[:,None]),X.shape)
  ma=np.maximum(np.maximum(abs(X),abs(Y)),abs(Z));xn=X/ma;yn=Y/ma;zn=Z/ma
  mappings=[('front',(Z>=0)&(abs(Z)==ma),xn,-yn),('back',(Z<0)&(abs(Z)==ma),-xn,-yn),('right',(X>=0)&(abs(X)==ma),-zn,-yn),('left',(X<0)&(abs(X)==ma),zn,-yn),('up',(Y>=0)&(abs(Y)==ma),xn,zn),('down',(Y<0)&(abs(Y)==ma),xn,-zn)]
  block=out[start:start+len(lat)]
  for key,mask,u,v in mappings:
   a=arrays[key];size=a.shape[0];px=np.clip((u[mask]+1)*size/2-.5,0,size-1);py=np.clip((v[mask]+1)*size/2-.5,0,size-1)
   x0=px.astype(int);y0=py.astype(int);x1=np.minimum(x0+1,size-1);y1=np.minimum(y0+1,size-1);dx=(px-x0)[:,None];dy=(py-y0)[:,None]
   block[mask]=((a[y0,x0]*(1-dx)+a[y0,x1]*dx)*(1-dy)+(a[y1,x0]*(1-dx)+a[y1,x1]*dx)*dy).astype(np.uint8)
 return Image.fromarray(out)

def save_panoramas(faces,folder,stem):
 # Filter the wall artwork before projection, then downsample the desktop view.
 # Point-sampling full-size wall art directly into 4K causes jagged small type.
 filtered={k:im.resize((2048,2048),Image.Resampling.LANCZOS) for k,im in faces.items()}
 hi=panorama(filtered,8192)
 hi.save(folder/(stem+'_360_hi.jpg'),quality=88,subsampling=2,optimize=True)
 hi.resize((4096,2048),Image.Resampling.LANCZOS).save(folder/(stem+'_360.jpg'),quality=90,subsampling=2,optimize=True)
