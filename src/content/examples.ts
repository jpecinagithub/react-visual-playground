/**
 * React Visual Playground — examples content.
 *
 * 15 guided examples + free-playground starter code.
 * Every user-facing string is bilingual (ES + EN).
 * `lines` in learn steps are 1-based inclusive ranges into the example's `code`.
 */

export interface LText {
  es: string;
  en: string;
}

export interface LearnStep {
  title: LText;
  body: LText;
  lines?: [number, number];
}

export interface Example {
  id: string;
  category: 'fundamentals' | 'state' | 'effects' | 'advanced' | 'app';
  title: LText;
  tagline: LText;
  code: string;
  concepts: string[];
  learn: LearnStep[];
}

export const EXAMPLES: Example[] = [
  {
    id: 'first-component',
    category: 'fundamentals',
    title: { es: 'Tu primer componente', en: 'Your first component' },
    tagline: {
      es: 'Un componente es una función que devuelve UI.',
      en: 'A component is a function that returns UI.',
    },
    code: `function Welcome() {
  return <h1>Hola React</h1>;
}

export default Welcome;`,
    concepts: ['component', 'jsx'],
    learn: [
      {
        title: { es: 'Un componente es una función', en: 'A component is a function' },
        body: {
          es: 'Welcome es una función normal de JavaScript. Nada más.',
          en: "Welcome is a plain JavaScript function. That's all.",
        },
        lines: [1, 3],
      },
      {
        title: { es: 'Devuelve UI', en: 'It returns UI' },
        body: {
          es: 'Lo que devuelve la función (el <h1>) es lo que React muestra en pantalla.',
          en: 'What the function returns (the <h1>) is what React shows on screen.',
        },
        lines: [2, 2],
      },
      {
        title: { es: 'export default', en: 'export default' },
        body: {
          es: 'export default Welcome; indica qué componente debe ejecutar el Playground.',
          en: 'export default Welcome; tells the playground which component to run.',
        },
        lines: [5, 5],
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Cambia el texto «Hola React» por tu nombre y pulsa Run (o Ctrl + Enter).',
          en: 'Change “Hola React” to your name and press Run (or Ctrl + Enter).',
        },
      },
      {
        title: { es: 'La idea clave', en: 'The key idea' },
        body: {
          es: 'Componente = función que devuelve UI. Todo React se construye sobre esto.',
          en: 'Component = function that returns UI. All of React builds on this.',
        },
      },
    ],
  },
  {
    id: 'jsx',
    category: 'fundamentals',
    title: { es: 'JSX', en: 'JSX' },
    tagline: {
      es: 'Valor de JavaScript → JSX → UI.',
      en: 'JavaScript value → JSX → UI.',
    },
    code: `export default function App() {
  const name = "Ana";

  return (
    <div>
      <h1>Hola {name}</h1>
      <p>Bienvenida a React</p>
    </div>
  );
}`,
    concepts: ['jsx', 'component'],
    learn: [
      {
        title: { es: 'JavaScript dentro del componente', en: 'JavaScript inside the component' },
        body: {
          es: 'const name = "Ana" es JavaScript normal dentro de la función.',
          en: 'const name = "Ana" is plain JavaScript inside the function.',
        },
        lines: [2, 2],
      },
      {
        title: { es: 'Las llaves inyectan valores', en: 'Curly braces inject values' },
        body: {
          es: 'Las llaves {name} insertan el valor de la variable dentro del marcado.',
          en: "Curly braces {name} inject the variable's value into the markup.",
        },
        lines: [6, 6],
      },
      {
        title: { es: 'JSX → UI', en: 'JSX → UI' },
        body: {
          es: 'React convierte el JSX en elementos reales del DOM que ves en el Preview.',
          en: 'React turns the JSX into real DOM elements you see in the Preview.',
        },
        lines: [4, 9],
      },
      {
        title: { es: 'Cualquier expresión', en: 'Any expression' },
        body: {
          es: 'Dentro de {} puedes poner cualquier expresión: {name.toUpperCase()}, {2 + 2}…',
          en: 'Inside {} you can put any expression: {name.toUpperCase()}, {2 + 2}…',
        },
      },
      {
        title: { es: 'Un solo padre', en: 'A single parent' },
        body: {
          es: 'El return debe devolver un único elemento padre (aquí, el <div>).',
          en: 'The return must produce a single parent element (here, the <div>).',
        },
        lines: [5, 8],
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Cambia "Ana" por otro nombre y observa cómo cambia la UI.',
          en: 'Change “Ana” to another name and watch the UI change.',
        },
      },
    ],
  },
  {
    id: 'props',
    category: 'fundamentals',
    title: { es: 'Props', en: 'Props' },
    tagline: {
      es: 'Las props viajan de padre a hijo.',
      en: 'Props flow from parent to child.',
    },
    code: `function Greeting({ name }) {
  return <h2>Hola {name}</h2>;
}

export default function App() {
  return <Greeting name="Carlos" />;
}`,
    concepts: ['component', 'props'],
    learn: [
      {
        title: { es: 'El padre envía datos', en: 'The parent sends data' },
        body: {
          es: 'App renderiza <Greeting name="Carlos" />: está pasando la prop name.',
          en: 'App renders <Greeting name="Carlos" />: it is passing the name prop.',
        },
        lines: [6, 6],
      },
      {
        title: { es: 'El hijo las recibe', en: 'The child receives them' },
        body: {
          es: 'Greeting recibe las props como parámetro: function Greeting({ name }).',
          en: 'Greeting receives props as a parameter: function Greeting({ name }).',
        },
        lines: [1, 1],
      },
      {
        title: { es: 'Flujo en una dirección', en: 'One-way flow' },
        body: {
          es: 'Las props viajan siempre de padre a hijo, nunca al revés.',
          en: 'Props always flow from parent to child, never the other way.',
        },
        lines: [1, 7],
      },
      {
        title: { es: 'Las props son de solo lectura', en: 'Props are read-only' },
        body: {
          es: 'El hijo no debe modificar sus props; si necesita cambiar algo, usa state.',
          en: 'The child must not modify its props; if it needs change, it uses state.',
        },
      },
      {
        title: { es: 'Mira el visualizador', en: 'Watch the visualizer' },
        body: {
          es: 'En la pestaña Props verás la flecha App → Greeting con name = "Carlos".',
          en: 'In the Props tab you will see the arrow App → Greeting with name = “Carlos”.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Cambia "Carlos" por otro nombre, o añade age={31} y úsalo dentro de Greeting.',
          en: 'Change “Carlos” to another name, or add age={31} and use it inside Greeting.',
        },
      },
    ],
  },
  {
    id: 'usestate',
    category: 'state',
    title: { es: 'useState', en: 'useState' },
    tagline: {
      es: 'El ejemplo estrella: el estado cambia → React re-renderiza → la UI se actualiza.',
      en: 'The star example: state changes → React re-renders → the UI updates.',
    },
    code: `import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Contador</h2>

      <p>{count}</p>

      <button onClick={() => setCount(count + 1)}>
        Incrementar
      </button>
    </div>
  );
}`,
    concepts: ['state', 'events'],
    learn: [
      {
        title: { es: '1. Creamos el estado', en: '1. We create the state' },
        body: {
          es: 'const [count, setCount] = useState(0); declara la variable count con valor inicial 0, y setCount para cambiarla.',
          en: 'const [count, setCount] = useState(0); declares the count variable with initial value 0, and setCount to change it.',
        },
        lines: [4, 4],
      },
      {
        title: { es: '2. React guarda el valor', en: '2. React stores the value' },
        body: {
          es: 'React recuerda que count = 0 aunque la función se vuelva a ejecutar.',
          en: 'React remembers that count = 0 even when the function runs again.',
        },
        lines: [4, 4],
      },
      {
        title: { es: '3. El usuario pulsa el botón', en: '3. The user presses the button' },
        body: {
          es: 'El clic dispara el onClick del botón.',
          en: "The click fires the button's onClick.",
        },
        lines: [12, 14],
      },
      {
        title: { es: '4. Ejecutamos setCount', en: '4. We run setCount' },
        body: {
          es: 'setCount(count + 1) pide a React que cambie count de 0 a 1.',
          en: 'setCount(count + 1) asks React to change count from 0 to 1.',
        },
        lines: [12, 12],
      },
      {
        title: { es: '5. React re-ejecuta el componente', en: '5. React re-runs the component' },
        body: {
          es: 'React vuelve a llamar a Counter() con el nuevo valor de count.',
          en: 'React calls Counter() again with the new count value.',
        },
        lines: [3, 17],
      },
      {
        title: { es: '6. Ahora count = 1', en: '6. Now count = 1' },
        body: {
          es: 'El JSX ahora contiene <p>1</p> en lugar de <p>0</p>.',
          en: 'The JSX now contains <p>1</p> instead of <p>0</p>.',
        },
        lines: [10, 10],
      },
      {
        title: { es: '7. React actualiza la interfaz', en: '7. React updates the interface' },
        body: {
          es: 'React actualiza solo el texto cambiado en el DOM. ¡Pulsa el botón y míralo en el Timeline!',
          en: 'React updates only the changed text in the DOM. Press the button and watch it in the Timeline!',
        },
        lines: [10, 10],
      },
    ],
  },
  {
    id: 'events',
    category: 'fundamentals',
    title: { es: 'Eventos', en: 'Events' },
    tagline: {
      es: 'Un clic dispara una función: Button → onClick → handleClick().',
      en: 'A click fires a function: Button → onClick → handleClick().',
    },
    code: `export default function App() {
  const handleClick = () => {
    alert("Hola");
  };

  return (
    <button onClick={handleClick}>
      Pulsar
    </button>
  );
}`,
    concepts: ['events', 'component'],
    learn: [
      {
        title: { es: 'Definimos el manejador', en: 'We define the handler' },
        body: {
          es: 'handleClick es una función normal que se ejecuta cuando ocurre el clic.',
          en: 'handleClick is a plain function that runs when the click happens.',
        },
        lines: [2, 4],
      },
      {
        title: { es: 'Lo conectamos al evento', en: 'We connect it to the event' },
        body: {
          es: 'onClick={handleClick} dice: «cuando me pulsen, llama a handleClick».',
          en: 'onClick={handleClick} says: “when I am clicked, call handleClick”.',
        },
        lines: [7, 7],
      },
      {
        title: { es: 'Sin paréntesis', en: 'No parentheses' },
        body: {
          es: 'Pasamos la función sin llamarla: onClick={handleClick}, no onClick={handleClick()}.',
          en: 'We pass the function without calling it: onClick={handleClick}, not onClick={handleClick()}.',
        },
        lines: [7, 7],
      },
      {
        title: { es: 'React escucha por ti', en: 'React listens for you' },
        body: {
          es: 'React se encarga de escuchar el clic en el DOM y llamar a tu función.',
          en: 'React listens for the DOM click and calls your function.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Pulsa el botón del Preview y mira la pestaña Eventos: verás la cadena Click → handleClick.',
          en: 'Press the Preview button and check the Events tab: you will see the Click → handleClick chain.',
        },
      },
    ],
  },
  {
    id: 'controlled-input',
    category: 'state',
    title: { es: 'Input controlado', en: 'Controlled input' },
    tagline: {
      es: 'Cada tecla → onChange → setName → render → UI actualizada.',
      en: 'Every keystroke → onChange → setName → render → updated UI.',
    },
    code: `import { useState } from "react";

export default function App() {
  const [name, setName] = useState("");

  return (
    <>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <p>Hola {name}</p>
    </>
  );
}`,
    concepts: ['state', 'events'],
    learn: [
      {
        title: { es: 'Estado para el texto', en: 'State for the text' },
        body: {
          es: 'name guarda lo que el usuario escribe; empieza vacío.',
          en: 'name holds what the user types; it starts empty.',
        },
        lines: [4, 4],
      },
      {
        title: { es: 'El input muestra el estado', en: 'The input shows the state' },
        body: {
          es: 'value={name} hace que el input muestre siempre el valor del estado.',
          en: 'value={name} makes the input always show the state value.',
        },
        lines: [8, 11],
      },
      {
        title: { es: 'Cada tecla actualiza el estado', en: 'Every key updates the state' },
        body: {
          es: 'onChange se dispara con cada tecla y llama a setName con el nuevo texto.',
          en: 'onChange fires on every keystroke and calls setName with the new text.',
        },
        lines: [10, 10],
      },
      {
        title: { es: 'El estado vuelve a la UI', en: 'The state flows back to the UI' },
        body: {
          es: 'Al cambiar name, React re-renderiza y <p>Hola {name}</p> se actualiza al instante.',
          en: 'When name changes, React re-renders and <p>Hola {name}</p> updates instantly.',
        },
        lines: [13, 13],
      },
      {
        title: { es: 'El bucle', en: 'The loop' },
        body: {
          es: 'Tecla → onChange → setName → render → input y párrafo actualizados. Escribe y míralo.',
          en: 'Key → onChange → setName → render → input and paragraph updated. Type and watch.',
        },
      },
      {
        title: { es: '¿Por qué «controlado»?', en: 'Why “controlled”?' },
        body: {
          es: 'Se llama controlado porque React controla el valor del input a través del estado.',
          en: 'It is called controlled because React controls the input’s value through state.',
        },
      },
    ],
  },
  {
    id: 'conditional',
    category: 'fundamentals',
    title: { es: 'Renderizado condicional', en: 'Conditional rendering' },
    tagline: {
      es: 'El estado decide qué rama del árbol está activa.',
      en: 'State decides which branch of the tree is active.',
    },
    code: `import { useState } from "react";

function Dashboard() {
  return <h2>Bienvenido al panel</h2>;
}

function Login() {
  return <h2>Inicia sesión</h2>;
}

export default function App() {
  const [logged, setLogged] = useState(true);

  return (
    <div>
      <button onClick={() => setLogged(!logged)}>
        {logged ? "Cerrar sesión" : "Iniciar sesión"}
      </button>

      {logged ? <Dashboard /> : <Login />}
    </div>
  );
}`,
    concepts: ['conditional', 'component', 'state'],
    learn: [
      {
        title: { es: 'Dos componentes', en: 'Two components' },
        body: {
          es: 'Dashboard y Login son componentes normales y corrientes.',
          en: 'Dashboard and Login are ordinary components.',
        },
        lines: [3, 9],
      },
      {
        title: { es: 'El estado decide', en: 'State decides' },
        body: {
          es: 'logged (true/false) decide qué rama se muestra.',
          en: 'logged (true/false) decides which branch shows.',
        },
        lines: [12, 12],
      },
      {
        title: { es: 'El ternario', en: 'The ternary' },
        body: {
          es: '{logged ? <Dashboard /> : <Login />} renderiza uno u otro según el valor.',
          en: '{logged ? <Dashboard /> : <Login />} renders one or the other based on the value.',
        },
        lines: [20, 20],
      },
      {
        title: { es: 'Cambiar de rama', en: 'Switching branches' },
        body: {
          es: 'El botón invierte logged con setLogged(!logged).',
          en: 'The button flips logged with setLogged(!logged).',
        },
        lines: [16, 18],
      },
      {
        title: { es: 'Montar y desmontar', en: 'Mount and unmount' },
        body: {
          es: 'Al cambiar, React desmonta un componente y monta el otro: míralo en el árbol.',
          en: 'When it changes, React unmounts one component and mounts the other: watch it in the tree.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Pulsa el botón varias veces y observa cómo el árbol cambia de rama.',
          en: 'Press the button a few times and watch the tree switch branches.',
        },
      },
    ],
  },
  {
    id: 'lists-keys',
    category: 'fundamentals',
    title: { es: 'Listas y keys', en: 'Lists and keys' },
    tagline: {
      es: 'Array → map() → componentes. La key dice a React qué es qué.',
      en: 'Array → map() → components. The key tells React what is what.',
    },
    code: `export default function App() {
  const users = [
    { id: 1, name: "Ana" },
    { id: 2, name: "Luis" },
    { id: 3, name: "Marta" }
  ];

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}`,
    concepts: ['lists', 'component'],
    learn: [
      {
        title: { es: 'Un array de datos', en: 'An array of data' },
        body: {
          es: 'users es un array normal de JavaScript con objetos.',
          en: 'users is a plain JavaScript array of objects.',
        },
        lines: [2, 6],
      },
      {
        title: { es: 'map crea componentes', en: 'map creates components' },
        body: {
          es: 'users.map(...) convierte cada objeto en un <li>.',
          en: 'users.map(...) turns each object into an <li>.',
        },
        lines: [10, 14],
      },
      {
        title: { es: 'La key', en: 'The key' },
        body: {
          es: 'key={user.id} le dice a React qué elemento es cuál.',
          en: 'key={user.id} tells React which element is which.',
        },
        lines: [11, 11],
      },
      {
        title: { es: 'Keys estables', en: 'Stable keys' },
        body: {
          es: 'Usa un id estable, no el índice del array: así React no se confunde al reordenar.',
          en: "Use a stable id, not the array index: that way React doesn't get confused when reordering.",
        },
      },
      {
        title: { es: 'Array → map → UI', en: 'Array → map → UI' },
        body: {
          es: 'Datos → map() → componentes → lista visible.',
          en: 'Data → map() → components → visible list.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Añade un cuarto usuario al array y pulsa Run: aparece un nuevo <li>.',
          en: 'Add a fourth user to the array and press Run: a new <li> appears.',
        },
      },
    ],
  },
  {
    id: 'parent-child',
    category: 'fundamentals',
    title: { es: 'Padre e hijo', en: 'Parent and child' },
    tagline: {
      es: 'Componentes pequeños que se combinan como piezas: App → Header, Product → Price, BuyButton, Footer.',
      en: 'Small components combined like pieces: App → Header, Product → Price, BuyButton, Footer.',
    },
    code: `function Header() {
  return <h1>Mi tienda</h1>;
}

function Price() {
  return <p>Precio: 25 €</p>;
}

function BuyButton() {
  return <button>Comprar</button>;
}

function Product() {
  return (
    <div>
      <h2>Camiseta</h2>
      <Price />
      <BuyButton />
    </div>
  );
}

function Footer() {
  return <p>Gracias por tu visita</p>;
}

export default function App() {
  return (
    <div>
      <Header />
      <Product />
      <Footer />
    </div>
  );
}`,
    concepts: ['component', 'props'],
    learn: [
      {
        title: { es: 'Piezas pequeñas', en: 'Small pieces' },
        body: {
          es: 'Header, Price, BuyButton y Footer son componentes simples e independientes.',
          en: 'Header, Price, BuyButton and Footer are simple, independent components.',
        },
        lines: [1, 25],
      },
      {
        title: { es: 'Composición', en: 'Composition' },
        body: {
          es: 'Product combina Price y BuyButton dentro de su JSX.',
          en: 'Product combines Price and BuyButton inside its JSX.',
        },
        lines: [13, 21],
      },
      {
        title: { es: 'App los une', en: 'App joins them' },
        body: {
          es: 'App coloca Header, Product y Footer como piezas de un puzzle.',
          en: 'App places Header, Product and Footer like puzzle pieces.',
        },
        lines: [27, 35],
      },
      {
        title: { es: 'Mira el árbol', en: 'Look at the tree' },
        body: {
          es: 'En la pestaña Componentes verás el árbol: App → Header, Product → Price, BuyButton, Footer.',
          en: 'In the Components tab you will see the tree: App → Header, Product → Price, BuyButton, Footer.',
        },
      },
      {
        title: { es: 'Reutilización', en: 'Reuse' },
        body: {
          es: 'Cada componente se puede usar en varios sitios sin repetir código.',
          en: 'Each component can be reused in several places without repeating code.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Cambia el precio en Price o añade otro <BuyButton /> dentro de Product.',
          en: 'Change the price in Price or add another <BuyButton /> inside Product.',
        },
      },
    ],
  },
  {
    id: 'lifted-state',
    category: 'state',
    title: { es: 'Estado levantado', en: 'Lifted state' },
    tagline: {
      es: 'Dos hermanos comparten datos a través del padre: ChildA (evento) → App (state) → ChildB (props).',
      en: 'Two siblings share data through the parent: ChildA (event) → App (state) → ChildB (props).',
    },
    code: `import { useState } from "react";

function ChildA({ onIncrement, onDecrement }) {
  return (
    <div>
      <button onClick={onDecrement}>-1</button>
      <button onClick={onIncrement}>+1</button>
    </div>
  );
}

function ChildB({ value }) {
  return <p>Cantidad: {value}</p>;
}

export default function App() {
  const [quantity, setQuantity] = useState(0);

  return (
    <div>
      <ChildA
        onIncrement={() => setQuantity(quantity + 1)}
        onDecrement={() => setQuantity(quantity - 1)}
      />
      <ChildB value={quantity} />
    </div>
  );
}`,
    concepts: ['lifting', 'state', 'props', 'events'],
    learn: [
      {
        title: { es: 'El estado vive en el padre', en: 'State lives in the parent' },
        body: {
          es: 'quantity vive en App, el padre común de ChildA y ChildB.',
          en: 'quantity lives in App, the common parent of ChildA and ChildB.',
        },
        lines: [17, 17],
      },
      {
        title: { es: 'ChildA recibe funciones', en: 'ChildA receives functions' },
        body: {
          es: 'App pasa onIncrement y onDecrement: ChildA puede pedir cambios.',
          en: 'App passes onIncrement and onDecrement: ChildA can request changes.',
        },
        lines: [21, 24],
      },
      {
        title: { es: 'ChildB recibe el valor', en: 'ChildB receives the value' },
        body: {
          es: 'App pasa value={quantity}: ChildB solo muestra el dato.',
          en: 'App passes value={quantity}: ChildB only displays the data.',
        },
        lines: [25, 25],
      },
      {
        title: { es: 'El evento sube', en: 'The event goes up' },
        body: {
          es: 'Pulsar +1 en ChildA llama a onIncrement, que ejecuta setQuantity en el padre.',
          en: 'Pressing +1 in ChildA calls onIncrement, which runs setQuantity in the parent.',
        },
        lines: [6, 7],
      },
      {
        title: { es: 'El dato baja', en: 'The data goes down' },
        body: {
          es: 'Al cambiar quantity, App re-renderiza y ChildB recibe la nueva prop.',
          en: 'When quantity changes, App re-renders and ChildB receives the new prop.',
        },
      },
      {
        title: { es: 'El flujo completo', en: 'The full flow' },
        body: {
          es: 'ChildA (evento) → App (state) → ChildB (props). Mira la animación en la pestaña Props.',
          en: 'ChildA (event) → App (state) → ChildB (props). Watch the animation in the Props tab.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Pulsa +1 y −1: ChildB se actualiza aunque nunca toca el estado.',
          en: 'Press +1 and −1: ChildB updates even though it never touches the state.',
        },
      },
    ],
  },
  {
    id: 'useeffect',
    category: 'effects',
    title: { es: 'useEffect', en: 'useEffect' },
    tagline: {
      es: 'Render dibuja la UI; el efecto hace el trabajo secundario. Orden: clic → render → efecto.',
      en: 'Render draws the UI; the effect does the side work. Order: click → render → effect.',
    },
    code: `import { useEffect, useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count \${count}\`;
  }, [count]);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}`,
    concepts: ['effect', 'state'],
    learn: [
      {
        title: { es: 'Estado como siempre', en: 'State as usual' },
        body: {
          es: 'count es un estado normal; el botón lo incrementa.',
          en: 'count is a normal state; the button increments it.',
        },
        lines: [4, 4],
      },
      {
        title: { es: 'El efecto', en: 'The effect' },
        body: {
          es: 'useEffect dice: «después de renderizar, ejecuta este código».',
          en: 'useEffect says: “after rendering, run this code”.',
        },
        lines: [6, 8],
      },
      {
        title: { es: 'Render primero, efecto después', en: 'Render first, effect after' },
        body: {
          es: 'Orden real: clic → setCount → RENDER (UI) → useEffect (título).',
          en: 'Real order: click → setCount → RENDER (UI) → useEffect (title).',
        },
      },
      {
        title: { es: 'Las dependencias', en: 'The dependencies' },
        body: {
          es: '[count] significa: ejecuta el efecto solo cuando count cambie.',
          en: '[count] means: run the effect only when count changes.',
        },
        lines: [8, 8],
      },
      {
        title: { es: 'Efecto ≠ render', en: 'Effect ≠ render' },
        body: {
          es: 'El render dibuja la UI; el efecto hace trabajo «secundario» (título, fetch, temporizadores).',
          en: 'Rendering draws the UI; the effect does “side” work (title, fetch, timers).',
        },
      },
      {
        title: { es: 'Míralo', en: 'Watch it' },
        body: {
          es: 'Pulsa el botón y fíjate en la pestaña del navegador: el título cambia DESPUÉS de que el número se actualice.',
          en: 'Press the button and watch the browser tab: the title changes AFTER the number updates.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Cambia el texto del título o añade un console.log dentro del efecto y mira la pestaña Console.',
          en: 'Change the title text or add a console.log inside the effect and check the Console tab.',
        },
      },
    ],
  },
  {
    id: 'fetch-effect',
    category: 'effects',
    title: { es: 'Fetch + useEffect', en: 'Fetch + useEffect' },
    tagline: {
      es: 'Montaje → efecto → fetch → loading → datos → render. Datos reales de una API pública.',
      en: 'Mount → effect → fetch → loading → data → render. Real data from a public API.',
    },
    code: `import { useEffect, useState } from "react";

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users?_limit=5")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Usuarios</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}`,
    concepts: ['effect', 'fetch', 'state', 'lists', 'conditional'],
    learn: [
      {
        title: { es: 'Dos estados', en: 'Two states' },
        body: {
          es: 'users guarda los datos; loading indica si estamos esperando.',
          en: "users holds the data; loading tells whether we're waiting.",
        },
        lines: [4, 5],
      },
      {
        title: { es: 'El efecto se ejecuta al montar', en: 'The effect runs on mount' },
        body: {
          es: 'Con [] como dependencias, el efecto se ejecuta una sola vez al montar el componente.',
          en: 'With [] as dependencies, the effect runs only once when the component mounts.',
        },
        lines: [7, 15],
      },
      {
        title: { es: 'La petición', en: 'The request' },
        body: {
          es: 'fetch pide los usuarios a una API pública real.',
          en: 'fetch requests the users from a real public API.',
        },
        lines: [8, 8],
      },
      {
        title: { es: 'Loading primero', en: 'Loading first' },
        body: {
          es: 'Mientras no hay datos, mostramos «Cargando...».',
          en: 'While there is no data, we show “Cargando…”.',
        },
        lines: [20, 22],
      },
      {
        title: { es: 'Llegan los datos', en: 'The data arrives' },
        body: {
          es: 'Cuando la respuesta llega, setUsers(data) guarda los usuarios y setLoading(false) quita el aviso.',
          en: 'When the response arrives, setUsers(data) stores the users and setLoading(false) removes the notice.',
        },
        lines: [10, 13],
      },
      {
        title: { es: 'Render con datos', en: 'Render with data' },
        body: {
          es: 'El nuevo render dibuja la lista con los nombres reales.',
          en: 'The new render draws the list with the real names.',
        },
        lines: [23, 27],
      },
      {
        title: { es: 'La cadena completa', en: 'The full chain' },
        body: {
          es: 'Montaje → efecto → fetch → loading → datos → setUsers → render. Mírala en el Timeline.',
          en: 'Mount → effect → fetch → loading → data → setUsers → render. Watch it in the Timeline.',
        },
      },
    ],
  },
  {
    id: 'memo',
    category: 'advanced',
    title: { es: 'useMemo / memo', en: 'useMemo / memo' },
    tagline: {
      es: 'Evita cálculos y renders innecesarios: el padre cambia, el hijo memo no se re-renderiza.',
      en: 'Skip unneeded calculations and renders: the parent changes, the memo child does not re-render.',
    },
    code: `import { memo, useMemo, useState } from "react";

let childRenders = 0;

const InfoCard = memo(function InfoCard({ label }) {
  childRenders += 1;
  return <p>{label} (renders: {childRenders})</p>;
});

export default function App() {
  const [count, setCount] = useState(0);

  const total = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += i;
    }
    return sum;
  }, []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Contador: {count}
      </button>
      <p>Suma calculada: {total}</p>
      <InfoCard label="Soy memo, no me re-renderizo" />
    </div>
  );
}`,
    concepts: ['memo', 'state'],
    learn: [
      {
        title: { es: 'Dos estados, dos zonas', en: 'Two states, two zones' },
        body: {
          es: 'count cambia con el botón; total se calcula una sola vez con useMemo.',
          en: 'count changes with the button; total is computed once with useMemo.',
        },
        lines: [11, 11],
      },
      {
        title: { es: 'Cálculo caro', en: 'Expensive calculation' },
        body: {
          es: 'El bucle suma 100.000 números. Sin useMemo se repetiría en cada render.',
          en: 'The loop sums 100,000 numbers. Without useMemo it would repeat on every render.',
        },
        lines: [13, 19],
      },
      {
        title: { es: 'useMemo memoriza', en: 'useMemo memorizes' },
        body: {
          es: 'useMemo guarda el resultado y solo lo recalcula si cambian las dependencias ([] = nunca).',
          en: 'useMemo stores the result and only recomputes if dependencies change ([] = never).',
        },
        lines: [13, 19],
      },
      {
        title: { es: 'Hijo memorizado', en: 'Memorized child' },
        body: {
          es: 'memo() envuelve InfoCard: si sus props no cambian, React salta su render.',
          en: "memo() wraps InfoCard: if its props don't change, React skips its render.",
        },
        lines: [5, 8],
      },
      {
        title: { es: 'El contador de renders', en: 'The render counter' },
        body: {
          es: 'childRenders cuenta cuántas veces se ejecuta InfoCard y lo muestra en pantalla.',
          en: 'childRenders counts how many times InfoCard runs and shows it on screen.',
        },
        lines: [6, 7],
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Pulsa el botón 5 veces: el contador del padre sube, pero «renders» de InfoCard sigue en 1.',
          en: 'Press the button 5 times: the parent counter goes up, but InfoCard’s “renders” stays at 1.',
        },
      },
      {
        title: { es: 'La idea', en: 'The idea' },
        body: {
          es: 'memo evita renders innecesarios; useMemo evita cálculos innecesarios.',
          en: 'memo avoids unnecessary renders; useMemo avoids unnecessary calculations.',
        },
      },
    ],
  },
  {
    id: 'context',
    category: 'advanced',
    title: { es: 'Context', en: 'Context' },
    tagline: {
      es: 'Un Provider reparte un valor a todos sus consumidores, sin prop drilling.',
      en: 'One Provider shares a value with all its consumers, no prop drilling.',
    },
    code: `import { createContext, useContext, useState } from "react";

const ThemeContext = createContext("claro");

function Navbar() {
  const theme = useContext(ThemeContext);
  return <p>Navbar · tema: {theme}</p>;
}

function Profile() {
  const theme = useContext(ThemeContext);
  return <p>Perfil · tema: {theme}</p>;
}

export default function App() {
  const [theme, setTheme] = useState("claro");

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setTheme(theme === "claro" ? "oscuro" : "claro")}>
        Cambiar a {theme === "claro" ? "oscuro" : "claro"}
      </button>
      <Navbar />
      <Profile />
    </ThemeContext.Provider>
  );
}`,
    concepts: ['context', 'state'],
    learn: [
      {
        title: { es: 'Creamos el contexto', en: 'We create the context' },
        body: {
          es: 'ThemeContext es un «canal» de datos compartido.',
          en: 'ThemeContext is a shared data “channel”.',
        },
        lines: [3, 3],
      },
      {
        title: { es: 'El Provider reparte', en: 'The Provider distributes' },
        body: {
          es: '<ThemeContext.Provider value={theme}> pone el valor a disposición de todo lo que hay dentro.',
          en: '<ThemeContext.Provider value={theme}> makes the value available to everything inside it.',
        },
        lines: [19, 19],
      },
      {
        title: { es: 'Los consumidores leen', en: 'Consumers read' },
        body: {
          es: 'useContext(ThemeContext) lee el valor actual sin recibir props.',
          en: 'useContext(ThemeContext) reads the current value without receiving props.',
        },
        lines: [6, 6],
      },
      {
        title: { es: 'Hermanos conectados', en: 'Connected siblings' },
        body: {
          es: 'Navbar y Profile son hermanos, pero ambos ven el mismo theme.',
          en: 'Navbar and Profile are siblings, yet both see the same theme.',
        },
        lines: [23, 24],
      },
      {
        title: { es: 'Cambiar el valor', en: 'Changing the value' },
        body: {
          es: 'El botón cambia theme en App; el Provider reparte el nuevo valor.',
          en: 'The button changes theme in App; the Provider distributes the new value.',
        },
        lines: [20, 22],
      },
      {
        title: { es: 'Sin prop drilling', en: 'No prop drilling' },
        body: {
          es: 'Sin contexto, theme tendría que viajar nivel a nivel por props. El contexto ataja.',
          en: 'Without context, theme would have to travel level by level via props. Context shortcuts it.',
        },
      },
      {
        title: { es: 'Pruébalo', en: 'Try it' },
        body: {
          es: 'Pulsa el botón: Navbar y Profile cambian a la vez.',
          en: 'Press the button: Navbar and Profile change at the same time.',
        },
      },
    ],
  },
  {
    id: 'todo-app',
    category: 'app',
    title: { es: 'Mini aplicación: lista de tareas', en: 'Mini app: task list' },
    tagline: {
      es: 'Todo junto: componentes, props, state, eventos, listas, formulario y condicional.',
      en: 'Everything together: components, props, state, events, lists, form and conditional.',
    },
    code: `import { useState } from "react";

function TodoForm({ onAdd }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() === "") return;
    onAdd(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Nueva tarea"
      />
      <button type="submit">Añadir</button>
    </form>
  );
}

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Eliminar</button>
    </li>
  );
}

export default function TodoApp() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    setTodos([...todos, { id: Date.now(), text, done: false }]);
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div>
      <h2>Lista de tareas ({todos.length})</h2>
      <TodoForm onAdd={addTodo} />
      {todos.length === 0 ? (
        <p>No hay tareas. ¡Añade la primera!</p>
      ) : (
        <ul>
          {todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
    </div>
  );
}`,
    concepts: ['component', 'props', 'state', 'events', 'lists', 'conditional'],
    learn: [
      {
        title: { es: 'Tres componentes', en: 'Three components' },
        body: {
          es: 'TodoForm (formulario), TodoItem (tarea) y TodoApp (el jefe que guarda la lista).',
          en: 'TodoForm (form), TodoItem (task) and TodoApp (the boss that holds the list).',
        },
        lines: [3, 37],
      },
      {
        title: { es: 'El estado central', en: 'The central state' },
        body: {
          es: 'todos es un array con todas las tareas; vive en TodoApp.',
          en: 'todos is an array with all the tasks; it lives in TodoApp.',
        },
        lines: [40, 40],
      },
      {
        title: { es: 'Añadir', en: 'Add' },
        body: {
          es: 'addTodo crea una tarea nueva y la añade al array con setTodos.',
          en: 'addTodo creates a new task and adds it to the array with setTodos.',
        },
        lines: [42, 44],
      },
      {
        title: { es: 'El formulario', en: 'The form' },
        body: {
          es: 'TodoForm guarda el texto en su propio estado y al enviar llama a onAdd.',
          en: 'TodoForm keeps the text in its own state and on submit calls onAdd.',
        },
        lines: [6, 11],
      },
      {
        title: { es: 'Marcar como hecha', en: 'Mark as done' },
        body: {
          es: 'toggleTodo invierte done de la tarea con ese id.',
          en: 'toggleTodo flips done for the task with that id.',
        },
        lines: [46, 50],
      },
      {
        title: { es: 'Eliminar', en: 'Delete' },
        body: {
          es: 'deleteTodo filtra el array quitando la tarea.',
          en: 'deleteTodo filters the array, removing the task.',
        },
        lines: [52, 54],
      },
      {
        title: { es: 'El condicional', en: 'The conditional' },
        body: {
          es: 'Si no hay tareas se muestra «No hay tareas»; si hay, la lista.',
          en: 'If there are no tasks it shows “No hay tareas”; otherwise, the list.',
        },
        lines: [60, 73],
      },
      {
        title: { es: 'Todo junto', en: 'All together' },
        body: {
          es: 'Componentes + props + state + eventos + listas + formulario + condicional: React en miniatura.',
          en: 'Components + props + state + events + lists + form + conditional: React in miniature.',
        },
      },
    ],
  },
];

export const FREE_CODE: string = `export default function App() {
  return (
    <div>
      <h1>Hello React</h1>
    </div>
  );
}`;
