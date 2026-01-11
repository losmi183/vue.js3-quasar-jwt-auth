// src/utils/format.js
function time(timeString) {
  const time = new Date(timeString)
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function calculateParticipant(participant) {
  const names = participant.map((p) => p.name)
  const title = names.join(', ')
  const display = names.join(', ')
  if (names.length <= 3)
    return {
      title: title,
      display: display,
    }
  const firstThree = names.slice(0, 3).join(', ')
  const remaining = names.length - 3
  return {
    title: title,
    display: `${firstThree} + ${remaining}`,
  }
}

const format = {
  time,
  calculateParticipant,
}

export default format
