import Elesar from './lib'

/** @jsx Elesar.createElement */

const App = () => {
  const [counter, setCounter] = Elesar.useState(0);
  return (
    <h1 onClick={() => setCounter(c => c + 1)}>
      Current count: {counter}. Click here to increment!
    </h1>
  )
}

const element = <App name="Elesar" />
const container = document.getElementById("root");
Elesar.render(element, container)
