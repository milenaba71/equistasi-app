from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
W,H=1080,1920
NAVY=(35,38,111); DARK=(18,20,58); Y=(250,220,0); WHITE=(255,255,255)
F='/usr/share/fonts/truetype/inter/'
import glob
def font(w,s):
    c=[f for f in glob.glob('/usr/share/fonts/**/Inter*%s*.ttf'%w,recursive=True)+glob.glob('/usr/share/fonts/**/Inter*%s*.otf'%w,recursive=True) if 'Display' not in f and 'Italic' not in f]
    return ImageFont.truetype(sorted(c,key=len)[0],s)
def base():
    im=Image.new('RGB',(W,H),DARK); d=ImageDraw.Draw(im)
    for y in range(H):
        t=y/H; c=tuple(int(NAVY[i]*(1-t)+DARK[i]*t) for i in range(3)); d.line([(0,y),(W,y)],fill=c)
    g=Image.new('L',(W,H),0); gd=ImageDraw.Draw(g); gd.ellipse((W-520,-260,W+380,640),fill=90); g=g.filter(ImageFilter.GaussianBlur(120))
    im=Image.composite(Image.new('RGB',(W,H),(70,80,200)),im,g)
    # yellow wave at bottom
    pts=[(x, 1560+60*math.sin(x/170)) for x in range(0,W+1,10)]+[(W,H),(0,H)]
    d=ImageDraw.Draw(im); d.polygon(pts,fill=Y)
    return im
def headline(im,l1,l2,hl,sub=None,y=150):
    d=ImageDraw.Draw(im); f=font('ExtraBold',84)
    for i,line in enumerate([l1,l2]):
        if not line: continue
        # highlight word hl in yellow
        x0=(W-d.textlength(line,font=f))/2; yy=y+i*100
        if hl and hl in line:
            a,b=line.split(hl,1)
            for part,col in [(a,WHITE),(hl,Y),(b,WHITE)]:
                d.text((x0,yy),part,font=f,fill=col); x0+=d.textlength(part,font=f)
        else: d.text((x0,yy),line,font=f,fill=WHITE)
    if sub:
        fs=font('Medium',38); d.text(((W-d.textlength(sub,font=fs))/2,y+215),sub,font=fs,fill=(200,205,235))
    return im
# phone layout
PW,PH=600,1298; BZ=18; PX=(W-PW-2*BZ)//2; PY=470
def phone_bg(l1,l2,hl,sub,out):
    im=base(); headline(im,l1,l2,hl,sub)
    sh=Image.new('L',(W,H),0); ImageDraw.Draw(sh).rounded_rectangle((PX+10,PY+30,PX+PW+2*BZ+10,PY+PH+2*BZ+40),radius=90,fill=150); sh=sh.filter(ImageFilter.GaussianBlur(40))
    im=Image.composite(Image.new('RGB',(W,H),(5,5,20)),im,sh)
    d=ImageDraw.Draw(im); d.rounded_rectangle((PX,PY,PX+PW+2*BZ,PY+PH+2*BZ),radius=86,fill=(12,12,18),outline=(90,95,130),width=3)
    im.save(out)
m=Image.new('L',(PW,PH),0); ImageDraw.Draw(m).rounded_rectangle((0,0,PW-1,PH-1),radius=70,fill=255); m.save('mask.png')
phone_bg('Attivalo','in un attimo','attimo','Inquadra il seriale: è subito abbinato','bg3.png')
phone_bg('Ti dice dove','applicarlo','applicarlo','Tocca la zona dove senti dolore','bg4.png')
phone_bg('Ti ricorda','quando toglierlo','toglierlo','Promemoria automatico dopo 2 ore','bg5.png')
# S2 product bg
im=base(); headline(im,'Ecco','Equistasi','Equistasi','Dispositivo medico indossabile'); im.save('bg2.png')
# S7 CTA
im=base(); d=ImageDraw.Draw(im)
logo=Image.open('/home/user/equistasipoint/img/logo.png').convert('RGBA'); lw=560; logo=logo.resize((lw,int(logo.height*lw/logo.width)))
card=Image.new('RGBA',(lw+80,logo.height+60),(255,255,255,255)); cm=Image.new('L',card.size,0); ImageDraw.Draw(cm).rounded_rectangle((0,0,card.width-1,card.height-1),radius=36,fill=255)
im.paste(card,((W-card.width)//2,150),cm); im.paste(logo,((W-lw)//2,180),logo)
icon=Image.open('/home/user/equistasipoint/img/icon-512.png').convert('RGBA').resize((220,220)); im_m=Image.new('L',(220,220),0); ImageDraw.Draw(im_m).rounded_rectangle((0,0,219,219),radius=50,fill=255)
y0=150+card.height+80
im.paste(icon,((W-220)//2,y0),im_m)
f1=font('ExtraBold',72); f2=font('Medium',40); f3=font('Bold',44)
def ctext(t,y,f,c): d.text(((W-d.textlength(t,font=f))/2,y),t,font=f,fill=c)
ctext('Scarica gratis',y0+260,f1,WHITE); ctext('Equistasi Point',y0+345,f1,Y)
# store pills
py=y0+470
for i,t in enumerate(['App Store','Google Play']):
    w=380; x=W//2-w-15 if i==0 else W//2+15
    d.rounded_rectangle((x,py,x+w,py+96),radius=48,fill=(10,10,16),outline=(255,255,255),width=3)
    d.text((x+(w-d.textlength(t,font=f3))/2,py+22),t,font=f3,fill=WHITE)
ctext('Acquista o noleggia il tuo dispositivo',py+150,f2,(225,228,245))
d.rounded_rectangle((W//2-330,py+215,W//2+330,py+315),radius=50,fill=Y)
ctext('shop.equistasi.com',py+238,f3,DARK)
im.save('bg7.png')
