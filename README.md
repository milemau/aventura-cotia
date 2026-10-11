# Aventura da Cotia

Endless runner 3D, vertical e web-first, para uma apresentação escolar sobre a profissão de Analista de TI. Interface em português, floresta low-poly e cotia antropomorfizada, sem roupas, com mochila escolar turquesa. Corre em duas pernas, com braços, joelhos e mochila animados; olhos pequenos e menos salientes, sorriso de boca fechada e pelagem dourada.

## Rodar

Requer Node.js 22.12+ (usado: 22.20). No Windows, use `npm.cmd` se o PowerShell bloquear `npm.ps1`.

```sh
npm install
npm run dev
```

Abra http://localhost:5173. O terminal também mostra o endereço da rede local para testar no celular conectado ao mesmo Wi-Fi. Acesso pela rede pode depender do firewall do Windows. PWA/offline exige HTTPS ou localhost; HTTP pelo IP da rede serve apenas para testar o jogo.

```sh
npm test          # regras e simulação prolongada
npm run build    # TypeScript + produção + service worker
npm run preview  # http://localhost:4173
```

Com o servidor aberto e Google Chrome instalado, `npm run test:browser` testa o fluxo no navegador. Para validar a produção e o modo offline no PowerShell:

```powershell
$env:TEST_URL = 'http://localhost:4173'
$env:TEST_OFFLINE = '1'
npm.cmd run test:browser
```

Capturas dos testes ficam em `test-results/`. Ícones PNG são gerados a partir de `public/icon.svg` por `npm run icons`.

## Mecânicas

- Corrida automática em três faixas.
- Setas esquerda/direita ou A/D, swipe horizontal e botões na tela para mudar de faixa.
- Espaço, seta para cima, W, swipe para cima ou botão PULAR.
- Um tipo de obstáculo: tronco. Desviar ou pular evita a colisão.
- Cada metro vale um ponto; cada moeda soma 10 pontos.
- Velocidade de 9 até 22 unidades/segundo, com progressão gradual.
- Game over, reinício e recorde no armazenamento local.
- Pausa com P/Esc ou botão; pausa automática ao sair da janela/aba.
- Trilha original “Trilha da Floresta” e efeitos sonoros sintetizados, com opção de silenciar persistente.
- Explicação “Como isso é feito?” para a apresentação.

## Escolha da stack

**Babylon.js + TypeScript + Vite + PWA** atende ao escopo. Babylon fornece renderização, câmera, materiais e modelos; TypeScript mantém as regras explícitas; Vite simplifica desenvolvimento e build; `vite-plugin-pwa` gera manifesto, service worker e cache da aplicação. Sem backend, login, fontes remotas ou arquivos de áudio.

- **WebGL como base:** evita exigir WebGPU dos computadores e celulares usados na escola. A renderização continua dependendo de suporte WebGL e aceleração gráfica no dispositivo.
- **Leveza:** formas de baixa complexidade, materiais compartilhados, limite de resolução em 1,5×, sem motor de física, sem pós-processamento e sem mapas de sombras. Árvores, troncos e moedas têm pools limitados e são reciclados.
- **Blender/GLB:** recomendado para a etapa de arte final. O protótipo usa uma cotia procedural, sem Blender ou GLB incorporado. Isso permite testar a brincadeira antes de investir na modelagem. Não há necessidade de Capacitor para este MVP web; um empacotamento nativo pode ser considerado depois.
- **PWA:** após abrir a versão de produção e concluir a instalação do service worker/cache, o jogo funciona offline. A instalação depende do navegador; no Chrome/Edge compatível, o botão aparece quando o navegador oferece a instalação. Em outros navegadores, use o menu de adicionar à tela inicial quando disponível.

Referências: [Babylon e módulos ES](https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers/), [suporte gráfico](https://www.babylonjs.com/specifications/), [Vite](https://vite.dev/guide/), [Vite PWA](https://vite-pwa-org.netlify.app/guide/).

## Organização

```text
src/game.ts        Regras sem dependência do navegador ou da engine
src/game.test.ts   Testes de colisão, pontuação, progressão e geração
src/world.ts       Cena e pools de meshes
src/cotia.ts       Cotia bípede procedural, mochila e animações articuladas
src/main.ts        Interface, entradas, áudio, pausa e recorde
src/music.ts       Trilha da Floresta: composição e reprodução procedural
src/teaching.ts    Explicação em seis passos, código comentado e experiências
src/teaching.css   Layout responsivo da explicação para a escola
src/style.css      Layout desktop e celular
vite.config.ts    Build e PWA
```

As regras avançam em pequenos passos para preservar colisões em quadros lentos. A geração bloqueia apenas uma faixa por fileira, coloca moedas em outra e mantém ao menos 1,55 s entre fileiras. O pulo é balístico e não permite pulo duplo. O limite de `dt` evita saltos grandes de simulação após travamentos; em dispositivos lentos, o jogo pode ficar mais lento em vez de atravessar obstáculos.

Para ajustar o rosto, edite `COTIA_FACE` no início de `src/cotia.ts`: `eyeScale` controla o tamanho dos olhos, `eyeDepth` a saliência, `eyeSpacing` a distância ao centro, `mouthWidth` a largura da boca fechada, `smileCurve` a elevação dos cantos e `mouthLineRadius` a espessura da linha. Os blocos `OLHOS` e `BOCA FECHADA` contêm a geometria. Em desenvolvimento, Vite atualiza a página ao salvar; para atualizar a versão de produção da porta 4173, execute `npm run build` e recarregue a página.

## Música: Trilha da Floresta

Composição instrumental original de aventura em Ré maior, a 100 BPM. O loop de 32 compassos dura 76,8 segundos, com tema de flauta sintetizada, arpejos suaves, baixo e percussão discreta. Uma segunda frase e uma retomada com notas agudas variam o arranjo.

A partitura e os instrumentos ficam em `src/music.ts`; Web Audio gera o som durante a partida, sem baixar MP3, bibliotecas extras ou amostras externas. Apenas um pequeno buffer de percussão de 60 ms é criado ao ativar o áudio. A trilha começa após a interação do jogador, pausa com o jogo ou ao silenciar, continua ao retomar e reinicia em uma nova corrida. O cache da aplicação também inclui a música para uso offline.

Com o servidor aberto, `npm run test:music` verifica a saída de áudio, silêncio na pausa e no mute, reinício, limite de vozes simultâneas e renderização do loop completo sem clipping. Use `TEST_URL` para testar outra porta.

## Próxima etapa: Blender/GLB

Para uma reprodução mais fiel da pelagem da imagem de referência, modelar a cotia antropomorfizada em pé, sem roupas, com mochila escolar e criar animações de corrida bípede e salto; exportar GLB com escala em metros. Um orçamento inicial sugerido é 2–5 mil triângulos e uma textura de até 512 px, a validar no celular alvo. A integração futura pode usar `@babylonjs/loaders`, substituir a implementação de `src/cotia.ts` e mapear as animações aos estados existentes, preservando as regras. A versão atual é uma interpretação estilizada em geometria 3D, sem textura de pelos ou arquivo GLB.

## Para a escola

1. Abra a versão de produção no dispositivo da apresentação com antecedência e faça uma corrida completa.
2. Recarregue sem internet para confirmar o cache naquele dispositivo.
3. Use “Como isso é feito?” para percorrer seis descobertas: personagem, direções, pulo, moedas, floresta e testes. Cada tela mostra uma explicação simples, um trecho real do código com comentários e uma pergunta para a turma. As experiências de faixas e moedas são independentes da partida. Os botões “Anterior” e “Próximo” ajudam na apresentação; também é possível escolher um assunto pelo número. No celular, role o conteúdo para ver o código. Ao abrir durante uma corrida, ela fica pausada até você continuar.
4. Demonstre o comando “se apertar espaço, pular” e deixe as crianças sugerirem novas regras.

O conteúdo pode ser editado na lista `lessons` em `src/teaching.ts`. Com a prévia aberta na porta 4173, `npm run test:teaching` verifica a navegação, as experiências, o desafio, a pausa e o layout em telas pequenas. A variável `TEST_URL` permite usar outro servidor.

O protótipo foi pensado para celular, mas desempenho, gestos e instalação precisam também ser conferidos no aparelho real usado na apresentação. Os testes automatizados de navegador usam emulação de viewport/toque e não substituem esse teste físico. Nenhuma publicação foi feita; `dist/` contém os arquivos para hospedagem estática com HTTPS. `base: './'` permite hospedar em subdiretórios.
