"""Gera site/capa.jpg (1200x630): a imagem do cartão do link no WhatsApp."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

AQUI = Path(__file__).parent
FONTE = 'C:/Windows/Fonts/bahnschrift.ttf'
TINTA, AMARELO, CELULA, TEXTO, APAGADO = '#16191d', '#ffcc00', '#23292f', '#f4f4ef', '#8a949e'
W, H = 1200, 630


def fonte(tam, estilo):
    f = ImageFont.truetype(FONTE, tam)
    f.set_variation_by_name(estilo)
    return f


img = Image.new('RGB', (W, H), TINTA)
d = ImageDraw.Draw(img)

# Faixa amarela fina no topo, como placa de aeroporto
d.rectangle([0, 0, W, 10], fill=AMARELO)

# Marca: placa amarela com avião + nome
px, py = 300, 58
d.rounded_rectangle([px, py, px + 56, py + 56], radius=9, fill=AMARELO)
aviao = ImageFont.truetype('C:/Windows/Fonts/seguisym.ttf', 40)
d.text((px + 28, py + 29), '\u2708', font=aviao, fill=TINTA, anchor='mm')
d.text((px + 74, py + 28), 'PESQUISA VIAGENS', font=fonte(34, b'Bold Condensed'), fill=TEXTO, anchor='lm')

# Título centralizado, com o destaque amarelo
t1 = fonte(88, b'Bold Condensed')
d.text((W // 2, 200), 'PARA ONDE VOCÊ VAI', font=t1, fill=TEXTO, anchor='mm')
destaque = 'DE VERDADE?'
bx = d.textbbox((W // 2, 292), destaque, font=t1, anchor='mm')
d.rectangle([bx[0] - 16, bx[1] - 10, bx[2] + 16, bx[3] + 12], fill=AMARELO)
d.text((W // 2, 292), destaque, font=t1, fill=TINTA, anchor='mm')

# Linha de apoio
d.text((W // 2, 378), 'Descubra seu perfil de viajante e quanto suas milhas podem render',
       font=fonte(30, b'Regular'), fill='#c9ced4', anchor='mm')

# Painel de partidas
linhas = [('07:40', 'LISBOA', 'EMBARQUE', False), ('??:??', 'SEU DESTINO', 'A DEFINIR', True)]
cel_w, cel_h, gap, n = 34, 46, 4, 11
x0 = (W - (90 + n * (cel_w + gap) + 30 + 170)) // 2
fl = fonte(30, b'Bold Condensed')
for i, (hora, dest, status, sua) in enumerate(linhas):
    y = 440 + i * (cel_h + 14)
    d.text((x0, y + cel_h // 2), hora, font=fonte(28, b'SemiBold Condensed'), fill=AMARELO if sua else APAGADO, anchor='lm')
    cx = x0 + 90
    for k in range(n):
        c = dest[k] if k < len(dest) else ' '
        d.rounded_rectangle([cx, y, cx + cel_w, y + cel_h], radius=3, fill=CELULA)
        d.line([cx, y + cel_h // 2, cx + cel_w, y + cel_h // 2], fill='#0b0d0f', width=1)
        if c != ' ':
            d.text((cx + cel_w // 2, y + cel_h // 2 + 1), c, font=fl, fill=AMARELO if sua else TEXTO, anchor='mm')
        cx += cel_w + gap
    d.text((cx + 30, y + cel_h // 2), status, font=fonte(26, b'SemiBold Condensed'), fill=AMARELO if sua else APAGADO, anchor='lm')

# Rodapé
d.text((W // 2, 598), 'ANÔNIMA  ·  3 MINUTOS  ·  RESULTADO NA HORA', font=fonte(24, b'SemiBold Condensed'), fill=APAGADO, anchor='mm')

saida = AQUI / 'site'
saida.mkdir(exist_ok=True)
img.save(saida / 'capa.jpg', quality=88, optimize=True)
print('capa.jpg', (saida / 'capa.jpg').stat().st_size, 'bytes')
