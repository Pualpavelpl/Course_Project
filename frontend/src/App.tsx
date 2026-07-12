import { useState, useEffect } from "react";


function App(){
  const API_URL = import.meta.env.VITE_API_URL;
  const [message, setMessage] = useState('Loading...');
  useEffect(() => {
    fetch(`${API_URL}/api/hello`)
      .then((response) => {
       return response.json();
    })
      .then((data) =>{
       setMessage(data.message)
    })
    .catch(() =>{
      setMessage("Backend connection error");
    })

  },[])

return (
  <main>
    <h1>Course Project</h1>
    <p>{message}</p>
  </main>
);
}
export default App;