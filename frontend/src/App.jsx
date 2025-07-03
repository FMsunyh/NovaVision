
import React, { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [speed, setSpeed] = useState(1.0)
  const [fps, setFps] = useState(0)
  const [taskId, setTaskId] = useState(null)
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState(null)

  const handleUpload = async () => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('speed', speed)
    formData.append('extract_fps', fps)

    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    setTaskId(data.task_id)
    setStatus('PENDING')
  }

  const checkStatus = async () => {
    if (!taskId) return
    const res = await fetch(`/status/${taskId}`)
    const data = await res.json()
    setStatus(data.status)
    if (data.status === 'SUCCESS') {
      setResult(`/result/${taskId}`)
    }
  }

  return (
    <div className="p-4">
      <h1>🎬 Video Processor</h1>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <input type="number" step="0.1" value={speed} onChange={e => setSpeed(e.target.value)} placeholder="Speed" />
      <input type="number" value={fps} onChange={e => setFps(e.target.value)} placeholder="FPS" />
      <button onClick={handleUpload}>Upload & Process</button>
      {taskId && <button onClick={checkStatus}>Check Status</button>}
      <p>Status: {status}</p>
      {result && (
        <div>
          <video src={result} controls width="400" />
          <a href={result} download>Download Video</a>
        </div>
      )}
    </div>
  )
}

export default App
