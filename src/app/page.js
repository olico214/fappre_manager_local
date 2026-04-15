import Dashboard from "./components/inicio";



export default function Home() {
  const url = 'http://51.210.246.210:3005/api'
  console.log(url)
  return (
    <div>
      <Dashboard url={url} />
    </div>
  )
}