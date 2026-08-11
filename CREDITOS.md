# Créditos e licenças das mídias

Todas as mídias em `assets/rounds/` são de uso livre, com as licenças abaixo.
Os créditos também aparecem discretamente na tela durante o jogo (campo `credito` no `rounds.json`).
**Se você trocar alguma imagem, atualize também o campo `credito` da rodada.**

| Rodada | Arquivo | Resposta | Origem | Autor | Licença |
|---|---|---|---|---|---|
| 1 | `01-lincoln-ia.jpg` | IA | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_using_a_smartphone_(anachronism).jpg) | Dennis Sylvester Hurd | CC0 (domínio público) |
| 2 | `02-cao-enchente-real.jpg` | REAL | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:IBPA_134667_-_Total_de_animais_resgatados_desde_o_in%C3%ADcio_da_enchente_-_2024-05-10_-_Cesar_Lopes-PMPA.jpeg) | Cesar Lopes / Prefeitura de Porto Alegre | Atribuição (crédito obrigatório) |
| 3 | `03-documento-ia.jpg` | IA | [Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:AI-generated_gibberish) | Google DeepMind (prompt de Primordial Soup) | Domínio público |
| 4 | `04-feira-real.jpg` | REAL | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mysore_-_Fruit_vendor.jpg) | Christopher J. Fynn | CC BY-SA 4.0 (crédito obrigatório) |
| 5 | `05-prato-ia.jpg` | IA | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Generative_AI_can_be_used_to_create_realistic_images_of_food_dishes.jpg) | Dennis Sylvester Hurd | CC0 (domínio público) |
| 6 | `06-praia-real.jpg` | REAL | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Sunset_on_the_Aresquiers_beach.jpg) | Christian Ferrer | CC BY 4.0 (crédito obrigatório) |
| 7 | `07-mammatus-real.png` | REAL | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Mammatus-clouds-Tulsa-1973.png) | NOAA (governo dos EUA) | Domínio público |
| 8 | `08-rosto-ia.jpg` | IA | [whichfaceisreal.com](https://www.whichfaceisreal.com/) | StyleGAN (NVIDIA) | Rosto sintético — pessoa inexistente |
| 9 | `09-rosto-real.jpg` | REAL | [whichfaceisreal.com](https://www.whichfaceisreal.com/) | Dataset FFHQ (foto do Flickr sob Creative Commons) | CC — uso educacional |
| 10 | `10-hotel-ia.jpg` | IA | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hotel_on_the_Coast_-_Flickr_-_Dennis_S._Hurd.jpg) | Dennis Sylvester Hurd | CC BY 4.0 (crédito obrigatório) |

São 5 fotos reais e 5 imagens de IA, alternadas para que ninguém acerte por padrão.

| Outros | Arquivo | Origem | Licença |
|---|---|---|---|
| Logo | `assets/logo-rec.png` | REC — Rede de Estudos Constitucionais (arquivo fornecido pela organização) | Marca da própria REC |

O logo foi convertido do JPEG original para PNG com fundo transparente, recortado nas margens
e reduzido para 760 px de largura, para pesar menos no tablet.

---

## Como o gabarito foi garantido

Esta é a parte mais importante e a mais fácil de errar. Bancos de imagem como Unsplash,
Pexels e Freepik hoje **hospedam imagens de IA misturadas com fotos**, muitas sem rótulo —
então "peguei de um banco de fotos" não é garantia de que a imagem é real.

O critério usado aqui foi **procedência, não aparência**:

- **Lado REAL** — só entrou foto com data de captura comprovada anterior a 2021 (quando ainda
  não existia geração fotorrealista acessível) ou vinda de arquivo institucional. A foto das
  nuvens é de **1973**; a da feira, de **2015**; o rosto vem do dataset FFHQ, coletado em **2019**.
  A única exceção é a foto do cão (2024), que vem do arquivo oficial da Prefeitura de Porto Alegre.
- **Lado IA** — só entrou imagem cuja geração está documentada na origem: as duas do Wikimedia
  Commons estão catalogadas como geradas por IA, e o rosto vem do StyleGAN por meio do
  [whichfaceisreal.com](https://www.whichfaceisreal.com/methods.html), projeto educacional dos
  professores Jevin West e Carl Bergstrom, da Universidade de Washington.

Se você substituir alguma imagem, aplique o mesmo critério: **desconfie de qualquer imagem cuja
origem você não consiga rastrear** — inclusive das que você acha que são obviamente reais.

## Casos brasileiros citados nas explicações

Dois casos reais que valem ser contados na dinâmica, mas cujas fotos são de imprensa
(direitos restritos) e por isso **não** foram embutidas no jogo:

- **Cavalo Caramelo** (Canoas/RS, maio de 2024) — passou quatro dias no telhado de uma casa
  durante a enchente e foi resgatado. A cena era tão inusitada que muita gente achou que a
  imagem fosse montagem ou IA. Era real, e foi transmitida ao vivo. Exemplo perfeito do risco
  oposto: duvidar do que é verdadeiro.
- **Enchentes do RS e desinformação** — a [Agência Lupa documentou](https://www.agencialupa.org/jornalismo/2025/05/09/desinformacao-agravou-impactos-da-enchente-e-atrasou-resposta-no-rs/)
  como a desinformação atrapalhou os resgates, incluindo imagens de IA que circularam como se
  fossem fotos da tragédia.

Se quiser usar essas imagens na apresentação, busque-as nos sites dos veículos e cite a fonte
na tela — é uso de citação, e não redistribuição.
