
import { Category, Question } from './types';

export const QUESTIONS_POOL: Question[] = [
  {
    id: '1',
    category: Category.RIPEAM,
    text: 'Duas embarcações a motor, cruzando com risco de abalroamento. Quem tem a preferência?',
    options: [
      'A que vê a outra pelo seu bombordo (lado esquerdo)',
      'A que vê a outra pelo seu boreste (lado direito)',
      'A de maior porte',
      'A que estiver mais veloz'
    ],
    correctAnswer: 0,
    explanation: 'De acordo com o RIPEAM, quando duas embarcações a motor se cruzam, a que vê a outra por bombordo tem a preferência (quem está à direita do outro deve ceder passagem).'
  },
  {
    id: '2',
    category: Category.BALIZAMENTO,
    text: 'Ao entrar em um canal vindo do mar, você avista uma boia cilíndrica encarnada (vermelha). Por qual lado você deve deixá-la?',
    options: [
      'Bombordo (lado esquerdo)',
      'Boreste (lado direito)',
      'Pelo meio do canal',
      'Depende da correnteza'
    ],
    correctAnswer: 0,
    explanation: 'No sistema IALA B (usado no Brasil), ao entrar em um porto ou canal vindo do mar, as boias encarnadas (vermelhas) devem ser deixadas por bombordo.'
  },
  {
    id: '3',
    category: Category.INCENDIO,
    text: 'Qual o extintor ideal para um incêndio em equipamentos elétricos energizados?',
    options: [
      'Água pressurizada',
      'Espuma mecânica',
      'CO2 (Gás Carbônico) ou Pó Químico Seco',
      'Balde de areia'
    ],
    correctAnswer: 2,
    explanation: 'Incêndios de Classe C (equipamentos elétricos) exigem agentes não condutores, como CO2 ou Pó Químico. Água e espuma conduzem eletricidade e são perigosos.'
  },
  {
    id: '4',
    category: Category.SOBREVIVENCA,
    text: 'Qual o sinal de socorro visual mais comum e obrigatório em embarcações de esporte e recreio?',
    options: [
      'Foguete pirotécnico de estrela vermelha com paraquedas',
      'Lanterna de LED branca',
      'Bandeira azul e branca',
      'Apito de longo alcance'
    ],
    correctAnswer: 0,
    explanation: 'Foguetes pirotécnicos são sinais visuais padrão de socorro reconhecidos internacionalmente.'
  },
  {
    id: '5',
    category: Category.MANOBRA,
    text: 'O que significa o termo "Gurnar"?',
    options: [
      'Mudar o rumo da embarcação',
      'Amarrar a embarcação ao cais',
      'Jogar a âncora',
      'Limpar o casco'
    ],
    correctAnswer: 0,
    explanation: 'Gurnar ou Guinada refere-se à mudança brusca ou intencional do rumo da embarcação.'
  },
  {
    id: '6',
    category: Category.NAVEGACAO,
    text: 'Qual instrumento é utilizado para medir a profundidade local?',
    options: [
      'Odômetro',
      'Prumo ou Ecobatímetro',
      'Sextante',
      'Agulha Magnética'
    ],
    correctAnswer: 1,
    explanation: 'O ecobatímetro utiliza ondas sonoras para medir a profundidade, enquanto o prumo é o método manual tradicional.'
  },
  {
    id: '7',
    category: Category.RIPEAM,
    text: 'Uma luz branca visível em todo o horizonte indica o quê?',
    options: [
      'Embarcação fundeada de comprimento inferior a 50 metros',
      'Embarcação com redes de pesca',
      'Embarcação em perigo',
      'Farol de terra'
    ],
    correctAnswer: 0,
    explanation: 'Uma luz circular branca visível em 360 graus é a luz de fundeio para embarcações menores que 50m.'
  },
  {
    id: '8',
    category: Category.BALIZAMENTO,
    text: 'Uma boia com faixas horizontais pretas e vermelhas e dois esferas pretas no topo indica:',
    options: [
      'Canal preferencial',
      'Perigo isolado',
      'Águas seguras',
      'Balizamento especial'
    ],
    correctAnswer: 1,
    explanation: 'Sinal de Perigo Isolado indica que há um perigo navegável ao redor dele, mas o ponto exato é perigoso.'
  },
  {
    id: '9',
    category: Category.INCENDIO,
    text: 'O "Triângulo do Fogo" é composto por:',
    options: [
      'Combustível, Comburente (Oxigênio) e Calor',
      'Madeira, Papel e Plástico',
      'Fumaça, Chama e Calor',
      'Água, Gás e Espuma'
    ],
    correctAnswer: 0,
    explanation: 'Para haver fogo, são necessários os três elementos: combustível, comburente e uma fonte de calor.'
  },
  {
    id: '10',
    category: Category.PRIMEIROS_SOCORROS,
    text: 'Em caso de hipotermia grave, o que NÃO deve ser feito?',
    options: [
      'Aquecer o corpo gradualmente',
      'Retirar roupas molhadas',
      'Dar bebidas alcoólicas para "esquentar"',
      'Cobrir com mantas térmicas'
    ],
    correctAnswer: 2,
    explanation: 'O álcool causa vasodilatação periférica, o que faz o corpo perder calor interno mais rápido, agravando a hipotermia.'
  }
];
