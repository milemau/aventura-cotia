import { Runner } from './game';
import './teaching.css';

// Conteúdo da apresentação: trechos reais, com comentários para leitura em voz alta.
const lessons = [
  {
    name: 'Personagem', title: 'Uma cotia feita de formas',
    explanation: 'É como brincar de massinha no computador! Juntamos formas, mudamos seus tamanhos e escolhemos as cores para montar a cotia e a mochila.',
    visual: '<div class="shape-recipe" aria-label="Esferas e caixas arredondadas formam a personagem"><span><i class="lesson-sphere"></i>Esferas</span><b>+</b><span><i class="lesson-box"></i>Caixas</span><b>=</b><span><img src="./icon.svg" alt=""/>Personagem</span></div>',
    file: 'src/cotia.ts', code: '// Escolhemos a cor da mochila\nconst teal = mat(\n  \'backpack • turquoise\',\n  \'#229f9d\'\n);',
    translation: 'mat cria um material, como uma tinta. #229f9d é o nome da cor turquesa na linguagem do computador.',
    concept: 'Código é uma lista de instruções.', question: 'Se você pudesse escolher outra cor para a mochila, qual seria?',
  },
  {
    name: 'Direções', title: 'Você manda, a cotia responde',
    explanation: 'O computador precisa receber uma instrução. Quando apertamos uma seta, o jogo pede à cotia que mude de caminho. Ela só pode escolher uma das três faixas.',
    visual: '<div class="lesson-lanes" aria-label="Demonstração das três faixas"><span data-lesson-lane="-1">Esquerda</span><span data-lesson-lane="0">Centro</span><span data-lesson-lane="1">Direita</span></div><div class="lesson-demo-actions"><button type="button" data-lesson-move="-1" aria-label="Experimentar faixa à esquerda">← Esquerda</button><button type="button" data-lesson-move="1" aria-label="Experimentar faixa à direita">Direita →</button></div><p id="lane-feedback" class="lesson-feedback" role="status"></p>',
    file: 'src/main.ts', code: '// Um pedido para cada direção\ngame.move(-1); // esquerda\ngame.move(1);  // direita',
    translation: 'move quer dizer mover. O número -1 pede uma faixa à esquerda; 1 pede uma faixa à direita. Aqui mostramos os dois comandos separadamente.',
    concept: 'Um comando provoca uma ação.', question: 'E se apertarmos esquerda quando já estamos na última faixa?',
  },
  {
    name: 'Pulo', title: '“Se” é uma palavrinha poderosa',
    explanation: 'A cotia só pode começar um pulo enquanto está correndo e com as patas no chão. Depois do impulso, a gravidade faz ela voltar. Assim, não sai voando!',
    visual: '<div class="jump-recipe"><span>1. Está no chão?</span><b>→</b><span>2. Pode pular!</span><b>→</b><span>3. Volta ao chão</span></div>',
    file: 'src/game.ts', code: 'if (this.phase === \'running\'\n    && this.y === 0) {\n  this.vy = JUMP_SPEED;\n}',
    translation: 'if significa “se”; && significa “e”. y é a altura: zero é o chão. vy é a velocidade para cima ou para baixo. JUMP_SPEED é a força inicial do pulo.',
    concept: 'Uma condição decide se algo pode acontecer.', question: 'Como seria jogar se a cotia pudesse pular de novo no meio do ar?',
  },
  {
    name: 'Moedas', title: 'O placar é uma continha',
    explanation: 'O jogo guarda quantas moedas você pegou, como um potinho que conta o que entra. Cada moeda vale 10 pontos. Os metros percorridos também entram na soma.',
    visual: '<div class="lesson-score"><span>Moedas<strong id="demo-coins">0</strong></span><b>× 10 =</b><span>Pontos das moedas<strong id="demo-points">0</strong></span></div><div class="lesson-demo-actions"><button type="button" id="demo-collect">Pegar uma moeda +</button><button type="button" id="demo-reset">Zerar</button></div><p id="coin-feedback" class="lesson-feedback" role="status">Vamos contar juntos? Este é só um placar de exemplo.</p>',
    file: 'src/game.ts', code: '// Ao pegar uma moeda\nthis.coins++;\n\n// Para calcular o placar\nMath.floor(this.distance)\n  + this.coins * 10',
    translation: 'coins guarda a quantidade de moedas. ++ soma uma. * significa multiplicar. Math.floor conta apenas os metros inteiros, sem as casas depois da vírgula.',
    concept: 'Uma variável guarda uma informação que pode mudar.', question: 'Com 3 moedas e 20 metros percorridos, quantos pontos teremos?',
  },
  {
    name: 'Floresta', title: 'O segredo da corrida sem fim',
    explanation: 'Parece que a cotia avança pela floresta, mas o cenário vem em direção a ela! Quando uma árvore passa, colocamos a mesma árvore lá na frente outra vez.',
    visual: '<div class="forest-recipe"><span>Árvore à frente</span><b>→</b><span>Passa pela cotia</span><b>→</b><span>Volta ao início ↻</span></div>',
    file: 'src/world.ts', code: '// Aproxima uma parte do cenário\nnode.position.z -= movement;\n\n// Se passou, volta para a frente\nif (node.position.z < -13) {\n  node.position.z += 110;\n}',
    translation: 'z indica a posição ao longo da pista. -= diminui esse valor; += aumenta. O jogo repete o movimento e desenha uma nova imagem muitas vezes por segundo, como um desenho animado.',
    concept: 'Repetir e reaproveitar ajuda o jogo a ficar leve.', question: 'Uma árvore que vemos duas vezes precisa ser criada duas vezes?',
  },
  {
    name: 'Testes', title: 'Quem cria também testa!',
    explanation: 'Um analista de TI pensa nas regras e confere se elas funcionam. Se a cotia encostar num tronco sem estar alta o suficiente, a corrida termina. Depois, podemos tentar de novo!',
    visual: '<div class="lesson-quiz"><strong>Desafio da turma</strong><p>Para testar a regra “não pode pular duas vezes no ar”, o que devemos fazer?</p><div class="lesson-demo-actions"><button type="button" data-quiz="wrong">Pegar duas moedas</button><button type="button" data-quiz="right">Pedir outro pulo no ar</button></div><p id="quiz-feedback" class="lesson-feedback" role="status">Escolha uma experiência para testar a regra.</p></div>',
    file: 'src/game.test.ts', code: '// Guardamos a velocidade no ar\nconst vy = game.vy;\n\n// Pedimos outro pulo\ngame.jump();\nexpect(game.vy).toBe(vy);',
    translation: 'Este trecho vem de um teste que já colocou a cotia no ar. expect confere o resultado: pedir outro pulo não deve mudar a velocidade. Se mudar, encontramos algo para corrigir!',
    concept: 'Testar é fazer uma experiência e conferir o resultado.', question: 'Agora você é quem cria: que nova regra colocaria neste jogo?',
  },
];

export const teachingMarkup = `
  <dialog id="about-dialog" class="teaching-dialog" aria-labelledby="teaching-title">
    <header class="teaching-header">
      <div><span class="eyebrow">POR TRÁS DA AVENTURA</span><h2 id="teaching-title">Como uma ideia vira um jogo?</h2></div>
      <button type="button" id="close-about" class="round-button" aria-label="Fechar explicação">×</button>
    </header>
    <div class="teaching-scroll">
      <p class="teaching-intro">Um analista de TI entende uma ideia, organiza os passos e usa tecnologia para construir soluções. Vamos descobrir como isso acontece neste jogo?</p>
      <nav class="lesson-nav" aria-label="Passos da explicação">${lessons.map((lesson, i) => `<button type="button" data-lesson="${i}" aria-label="Passo ${i + 1}: ${lesson.name}"><span>${i + 1}</span>${lesson.name}</button>`).join('')}</nav>
      <article id="lesson-content"></article>
    </div>
    <div class="teaching-footer"><button type="button" id="lesson-prev">← Anterior</button><span id="lesson-progress"></span><button type="button" id="lesson-next">Próximo →</button></div>
  </dialog>`;

export function setupTeaching(dialog: HTMLDialogElement) {
  let current = 0;
  let coins = 0;
  // Uma instância separada usa as mesmas regras de faixas, sem afetar a partida.
  const demo = new Runner(); demo.start();
  const content = dialog.querySelector<HTMLElement>('#lesson-content')!;
  const previous = dialog.querySelector<HTMLButtonElement>('#lesson-prev')!;
  const next = dialog.querySelector<HTMLButtonElement>('#lesson-next')!;
  const updateLane = () => {
    content.querySelectorAll<HTMLElement>('[data-lesson-lane]').forEach(lane => {
      lane.classList.toggle('selected', Number(lane.dataset.lessonLane) === demo.lane);
    });
    content.querySelector('#lane-feedback')!.textContent = `A cotia está na faixa: ${['esquerda', 'centro', 'direita'][demo.lane + 1]}.`;
  };
  const render = (focus = false) => {
    const lesson = lessons[current];
    content.innerHTML = `<div class="lesson-heading"><span class="small-label">DESCOBERTA ${current + 1}</span><h3 tabindex="-1">${lesson.title}</h3><p>${lesson.explanation}</p></div>
      <div class="lesson-columns"><section class="lesson-experiment" aria-label="Explicação e experiência"><div class="lesson-visual">${lesson.visual}</div><p class="lesson-concept">${lesson.concept}</p><div class="lesson-question"><span>PARA PENSAR EM VOZ ALTA</span><p>${lesson.question}</p></div></section>
      <section class="lesson-code" aria-label="Código do jogo explicado"><div class="lesson-code-label"><strong>Código de verdade</strong><span>${lesson.file}</span></div><pre><code></code></pre><p class="lesson-code-note">Trecho do jogo, com comentários para ajudar a leitura.</p><p class="lesson-translation">${lesson.translation}</p></section></div>`;
    content.querySelector('pre code')!.textContent = lesson.code;
    dialog.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach(button => {
      if (Number(button.dataset.lesson) === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = current === 0;
    next.textContent = current === lessons.length - 1 ? 'Voltar ao jogo ✓' : 'Próximo →';
    dialog.querySelector('#lesson-progress')!.textContent = `${current + 1} de ${lessons.length}`;
    if (current === 1) { demo.start(); updateLane(); }
    if (current === 3) coins = 0;
    dialog.querySelector('.teaching-scroll')!.scrollTop = 0;
    if (focus) content.querySelector<HTMLElement>('h3')!.focus({ preventScroll: true });
  };
  dialog.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!button) return;
    if (button.dataset.lesson !== undefined) { current = Number(button.dataset.lesson); render(true); }
    if (button.dataset.lessonMove) { demo.move(Number(button.dataset.lessonMove)); updateLane(); }
    if (button.id === 'demo-collect' || button.id === 'demo-reset') {
      coins = button.id === 'demo-reset' ? 0 : coins + 1;
      content.querySelector('#demo-coins')!.textContent = String(coins);
      content.querySelector('#demo-points')!.textContent = String(coins * 10);
      content.querySelector('#coin-feedback')!.textContent = `${coins} ${coins === 1 ? 'moeda vale' : 'moedas valem'} ${coins * 10} pontos. E os metros ainda entram na soma!`;
    }
    if (button.dataset.quiz) content.querySelector('#quiz-feedback')!.textContent = button.dataset.quiz === 'right'
      ? 'Isso! Pedimos outro pulo no ar e conferimos que ele não começa de novo. Testar é investigar!'
      : 'Pegar moedas testa o placar. Para testar o pulo, precisamos experimentar o comando de pular. Tente outra opção!';
  });
  previous.onclick = () => { if (current > 0) { current--; render(true); } };
  next.onclick = () => { if (current < lessons.length - 1) { current++; render(true); } else dialog.close(); };
  render();
}
