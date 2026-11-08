'use strict';

const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const botaoMenu = document.querySelector('.cabecalho__botao-menu');
const menu = document.getElementById('menu-principal');

function alternarMenu(abrir) {
  botaoMenu.setAttribute('aria-expanded', String(abrir));
  botaoMenu.querySelector('use').setAttribute('href', abrir ? '#i-fechar' : '#i-menu');
  botaoMenu.querySelector('span').textContent = abrir ? 'Fechar' : 'Menu';
  menu.classList.toggle('menu--aberto', abrir);
  document.body.classList.toggle('sem-rolagem', abrir);
}

botaoMenu.addEventListener('click', () => {
  alternarMenu(botaoMenu.getAttribute('aria-expanded') !== 'true');
});

menu.addEventListener('click', (evento) => {
  if (evento.target.closest('a')) alternarMenu(false);
});

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape' && menu.classList.contains('menu--aberto')) {
    alternarMenu(false);
    botaoMenu.focus();
  }
});

window.matchMedia('(min-width: 1080px)').addEventListener('change', (consulta) => {
  if (consulta.matches) alternarMenu(false);
});



const linksMenu = [...menu.querySelectorAll('.menu__lista a')];

const observadorSecoes = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (!entrada.isIntersecting) return;
    linksMenu.forEach((link) => {
      if (link.hash === '#' + entrada.target.id) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main > section[id]').forEach((secao) => observadorSecoes.observe(secao));


document.querySelectorAll('.faixa').forEach((faixa) => {
  let ponteiro = null;
  let inicioX = 0;
  let inicioRolagem = 0;
  let arrastou = false;

  faixa.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType !== 'mouse' || evento.button !== 0) return;
    ponteiro = evento.pointerId;
    inicioX = evento.clientX;
    inicioRolagem = faixa.scrollLeft;
    arrastou = false;
  });

  faixa.addEventListener('pointermove', (evento) => {
    if (evento.pointerId !== ponteiro) return;
    const distancia = evento.clientX - inicioX;

    if (!arrastou && Math.abs(distancia) > 6) {
      arrastou = true;
      faixa.setPointerCapture(ponteiro);
      faixa.classList.add('faixa--arrastando');
    }
    if (arrastou) faixa.scrollLeft = inicioRolagem - distancia;
  });

  const soltar = () => {
    ponteiro = null;
    faixa.classList.remove('faixa--arrastando');
  };
  faixa.addEventListener('pointerup', soltar);
  faixa.addEventListener('pointercancel', soltar);

  faixa.addEventListener('click', (evento) => {
    if (!arrastou) return;
    evento.preventDefault();
    evento.stopPropagation();
    arrastou = false;
  }, true);
});

document.querySelectorAll('.seta[data-faixa]').forEach((seta) => {
  const faixa = document.getElementById(seta.dataset.faixa);
  seta.addEventListener('click', () => {
    if (seta.getAttribute('aria-disabled') === 'true') return;
    faixa.scrollBy({
      left: Number(seta.dataset.direcao) * faixa.clientWidth * 0.8,
      behavior: reduzirMovimento ? 'auto' : 'smooth',
    });
  });
});

function atualizarSetas(faixa) {
  const fim = faixa.scrollWidth - faixa.clientWidth - 2;
  document.querySelectorAll(`.seta[data-faixa="${faixa.id}"]`).forEach((seta) => {
    const parada = Number(seta.dataset.direcao) < 0 ? faixa.scrollLeft <= 2 : faixa.scrollLeft >= fim;
    seta.setAttribute('aria-disabled', String(parada));
  });
}

document.querySelectorAll('.faixa[id]').forEach((faixa) => {
  atualizarSetas(faixa);
  faixa.addEventListener('scroll', () => atualizarSetas(faixa), { passive: true });
  window.addEventListener('resize', () => atualizarSetas(faixa));
});

function animarContador(elemento) {
  const final = Number(elemento.dataset.contar);
  const duracao = 1600;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const suavizado = 1 - Math.pow(1 - progresso, 3); // desacelera no final
    elemento.textContent = '+' + Math.round(final * suavizado).toLocaleString('pt-BR');
    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

if (!reduzirMovimento) {
  const observadorNumeros = new IntersectionObserver((entradas, observador) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      animarContador(entrada.target);
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[data-contar]').forEach((contador) => {
    contador.textContent = '+0';
    observadorNumeros.observe(contador);
  });
}


if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const midia = gsap.matchMedia();

  midia.add('(prefers-reduced-motion: no-preference)', () => {
    const cabecalho = document.querySelector('.cabecalho');

    const jornada = document.querySelector('.jornada');
    const faixaJornada = jornada.querySelector('.jornada__faixa');
    const trilho = jornada.querySelector('.jornada__trilho');
    jornada.classList.add('jornada--fixa');

    const distancia = () => trilho.scrollWidth - faixaJornada.clientWidth;

    gsap.to(trilho, {
      x: () => -distancia(),
      ease: 'none',
      scrollTrigger: {
        trigger: jornada,
        start: () => 'top ' + cabecalho.offsetHeight + 'px',
        end: () => '+=' + distancia(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    const galeria = document.querySelector('.galeria');
    galeria.classList.add('galeria--movel');

    galeria.querySelectorAll('.galeria__janela').forEach((janela, indice) => {
      const sobra = () => janela.scrollWidth - janela.clientWidth;
      const paraEsquerda = indice % 2 === 0;

      gsap.fromTo(janela,
        { scrollLeft: () => (paraEsquerda ? 0 : sobra()) },
        {
          scrollLeft: () => (paraEsquerda ? sobra() : 0),
          ease: 'none',
          scrollTrigger: {
            trigger: galeria,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
    });

    return () => {
      jornada.classList.remove('jornada--fixa');
      galeria.classList.remove('galeria--movel');
    };
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const janelaFoto = document.querySelector('.ampliar');
const fotoAmpliada = janelaFoto.querySelector('.ampliar__foto');
const legendaAmpliada = janelaFoto.querySelector('.ampliar__legenda');
const botoesGaleria = [...document.querySelectorAll('.galeria__botao')];
let fotoAtual = 0;

function mostrarFoto(indice) {
  fotoAtual = (indice + botoesGaleria.length) % botoesGaleria.length;
  const botao = botoesGaleria[fotoAtual];
  fotoAmpliada.src = botao.dataset.grande;
  fotoAmpliada.alt = botao.querySelector('img').alt;
  legendaAmpliada.textContent = botao.closest('figure').querySelector('figcaption').textContent;
}

botoesGaleria.forEach((botao, indice) => {
  botao.addEventListener('click', () => {
    mostrarFoto(indice);
    janelaFoto.showModal();
    document.body.classList.add('sem-rolagem');
  });
});

janelaFoto.querySelector('.ampliar__fechar').addEventListener('click', () => janelaFoto.close());
janelaFoto.querySelector('.ampliar__anterior').addEventListener('click', () => mostrarFoto(fotoAtual - 1));
janelaFoto.querySelector('.ampliar__proxima').addEventListener('click', () => mostrarFoto(fotoAtual + 1));

janelaFoto.addEventListener('keydown', (evento) => {
  if (evento.key === 'ArrowLeft') mostrarFoto(fotoAtual - 1);
  if (evento.key === 'ArrowRight') mostrarFoto(fotoAtual + 1);
});

janelaFoto.addEventListener('click', (evento) => {
  if (evento.target === janelaFoto) janelaFoto.close();
});

janelaFoto.addEventListener('close', () => document.body.classList.remove('sem-rolagem'));

document.querySelectorAll('[data-copiar]').forEach((botao) => {
  const chave = document.getElementById(botao.dataset.copiar);
  const status = botao.parentElement.querySelector('.pix__status');

  botao.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(chave.textContent.trim());
      status.textContent = 'Chave copiada. Agora é só colar no app do seu banco.';
    } catch {
      const intervalo = document.createRange();
      intervalo.selectNodeContents(chave);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(intervalo);
      status.textContent = 'Não foi possível copiar automaticamente. A chave ficou selecionada para você copiar.';
    }
  });
});

const formulario = document.querySelector('.formulario');
const retorno = formulario.querySelector('.formulario__retorno');
const campos = [...formulario.querySelectorAll('input, textarea')];

const mensagensDeErro = {
  nome: 'Informe seu nome.',
  email: 'Informe um e-mail válido, como nome@exemplo.com.',
  telefone: 'Informe um telefone com DDD, como (54) 99999-9999.',
  mensagem: 'Escreva uma mensagem com pelo menos 10 caracteres.',
};

function validarCampo(campo) {
  const soEspacos = campo.required && campo.value.trim() === '';
  const valido = !soEspacos && campo.checkValidity();
  campo.setAttribute('aria-invalid', String(!valido));
  document.getElementById(campo.id + '-erro').textContent = valido ? '' : mensagensDeErro[campo.name];
  return valido;
}

campos.forEach((campo) => {
  campo.addEventListener('blur', () => {
    if (campo.value) validarCampo(campo);
  });
  campo.addEventListener('input', () => {
    if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
  });
});

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const invalidos = campos.filter((campo) => !validarCampo(campo));
  if (invalidos.length) {
    retorno.textContent = '';
    invalidos[0].focus();
    return;
  }

  const primeiroNome = formulario.elements.nome.value.trim().split(/\s+/)[0];
  retorno.textContent = `Tudo certo, ${primeiroNome}! Como esta página é uma demonstração acadêmica, a mensagem não foi enviada. Para falar com a ONG, use o WhatsApp (54) 9121-2452.`;
  formulario.reset();
  campos.forEach((campo) => campo.removeAttribute('aria-invalid'));
});
