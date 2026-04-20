import Dashboard from "./components/inicio";


export default function Home() {
  const urlback = process.env.URL
  return (
    <div>
      <Dashboard url={urlback} />
    </div>
  )
}