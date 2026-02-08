// Free Exercise Database Service
// Uses open-source exercise data with GIFs - NO API KEY REQUIRED

const EXERCISES_JSON_URL = 'https://raw.githubusercontent.com/azilRababe/Exercises_Dataset/main/gifs_data.json'
const FITNESS_DATA_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

// Cache for exercises
let exercisesCache = null
let detailedExercisesCache = null
let lastFetch = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

// Fetch exercises with GIFs
async function fetchExercisesWithGifs() {
  if (exercisesCache && Date.now() - lastFetch < CACHE_DURATION) {
    return exercisesCache
  }

  try {
    const response = await fetch(EXERCISES_JSON_URL)
    const data = await response.json()
    exercisesCache = data
    lastFetch = Date.now()
    return data
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return exercisesCache || []
  }
}

// Fetch detailed exercises (with instructions)
async function fetchDetailedExercises() {
  if (detailedExercisesCache && Date.now() - lastFetch < CACHE_DURATION) {
    return detailedExercisesCache
  }

  try {
    const response = await fetch(FITNESS_DATA_URL)
    const data = await response.json()
    detailedExercisesCache = data
    return data
  } catch (error) {
    console.error('Error fetching detailed exercises:', error)
    return detailedExercisesCache || []
  }
}

// Get all body parts
export async function getBodyParts() {
  const exercises = await fetchExercisesWithGifs()
  const bodyParts = [...new Set(exercises.map(ex => ex.body_part).filter(Boolean))]
  return bodyParts.sort()
}

// Get all equipment list
export async function getEquipmentList() {
  const detailed = await fetchDetailedExercises()
  const equipment = [...new Set(detailed.map(ex => ex.equipment).filter(Boolean))]
  return equipment.sort()
}

// Get all target muscles
export async function getTargetMuscles() {
  const detailed = await fetchDetailedExercises()
  const muscles = [...new Set(detailed.flatMap(ex => ex.primaryMuscles || []).filter(Boolean))]
  return muscles.sort()
}

// Get exercises by body part
export async function getExercisesByBodyPart(bodyPart, limit = 50) {
  const exercises = await fetchExercisesWithGifs()
  const filtered = exercises
    .filter(ex => ex.body_part?.toLowerCase() === bodyPart.toLowerCase())
    .slice(0, limit)
    .map(normalizeExercise)
  return filtered
}

// Get exercises by target muscle
export async function getExercisesByTarget(target, limit = 50) {
  const detailed = await fetchDetailedExercises()
  const gifExercises = await fetchExercisesWithGifs()

  const filtered = detailed
    .filter(ex => ex.primaryMuscles?.some(m => m.toLowerCase().includes(target.toLowerCase())))
    .slice(0, limit)
    .map(ex => mergeWithGif(ex, gifExercises))

  return filtered
}

// Get exercises by equipment
export async function getExercisesByEquipment(equipment, limit = 50) {
  const detailed = await fetchDetailedExercises()
  const gifExercises = await fetchExercisesWithGifs()

  const filtered = detailed
    .filter(ex => ex.equipment?.toLowerCase() === equipment.toLowerCase())
    .slice(0, limit)
    .map(ex => mergeWithGif(ex, gifExercises))

  return filtered
}

// Search exercises by name
export async function searchExercises(query, limit = 50) {
  const exercises = await fetchExercisesWithGifs()
  const detailed = await fetchDetailedExercises()
  const normalizedQuery = query.toLowerCase().trim()

  // Search in GIF exercises
  const gifResults = exercises
    .filter(ex => ex.title?.toLowerCase().includes(normalizedQuery))
    .slice(0, limit)
    .map(normalizeExercise)

  // Search in detailed exercises and merge with GIFs
  const detailedResults = detailed
    .filter(ex => ex.name?.toLowerCase().includes(normalizedQuery))
    .slice(0, limit)
    .map(ex => mergeWithGif(ex, exercises))

  // Combine and dedupe
  const combined = [...gifResults]
  const existingNames = new Set(gifResults.map(ex => ex.name.toLowerCase()))

  detailedResults.forEach(ex => {
    if (!existingNames.has(ex.name.toLowerCase())) {
      combined.push(ex)
    }
  })

  return combined.slice(0, limit)
}

// Get all exercises
export async function getAllExercises(limit = 50, offset = 0) {
  const exercises = await fetchExercisesWithGifs()
  return exercises
    .slice(offset, offset + limit)
    .map(normalizeExercise)
}

// Get exercise by ID
export async function getExerciseById(id) {
  const exercises = await fetchExercisesWithGifs()
  const exercise = exercises.find(ex => ex.id === id)
  return exercise ? normalizeExercise(exercise) : null
}

// Find exercise GIF by name (for workout page)
export async function findExerciseGif(exerciseName) {
  if (!exerciseName) return null

  const exercises = await fetchExercisesWithGifs()
  const detailed = await fetchDetailedExercises()
  const normalizedName = exerciseName.toLowerCase().trim()

  // Try exact match first
  let match = exercises.find(ex =>
    ex.title?.toLowerCase() === normalizedName
  )

  // Try partial match
  if (!match) {
    match = exercises.find(ex =>
      ex.title?.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(ex.title?.toLowerCase() || '')
    )
  }

  // Try word-by-word match
  if (!match) {
    const words = normalizedName.split(' ').filter(w => w.length > 2)
    match = exercises.find(ex => {
      const title = ex.title?.toLowerCase() || ''
      return words.some(word => title.includes(word))
    })
  }

  if (match) {
    // Get detailed info if available
    const detailedMatch = detailed.find(d =>
      d.name?.toLowerCase().includes(match.title?.toLowerCase() || '') ||
      match.title?.toLowerCase().includes(d.name?.toLowerCase() || '')
    )

    return {
      gifUrl: match.gif_url,
      name: match.title,
      target: match.body_part,
      bodyPart: match.body_part,
      equipment: detailedMatch?.equipment || null,
      instructions: detailedMatch?.instructions || [],
      primaryMuscles: detailedMatch?.primaryMuscles || [match.body_part],
      secondaryMuscles: detailedMatch?.secondaryMuscles || []
    }
  }

  return null
}

// Bulk find GIFs for multiple exercises
export async function findExerciseGifs(exerciseNames) {
  const results = {}

  for (const name of exerciseNames) {
    const gif = await findExerciseGif(name)
    results[name] = gif
  }

  return results
}

// Helper: Normalize exercise from GIF dataset
function normalizeExercise(ex) {
  return {
    id: ex.id,
    name: ex.title,
    gifUrl: ex.gif_url,
    bodyPart: ex.body_part,
    target: ex.body_part,
    equipment: null,
    instructions: [],
    secondaryMuscles: []
  }
}

// Helper: Merge detailed exercise with GIF data
function mergeWithGif(detailed, gifExercises) {
  const normalizedName = detailed.name?.toLowerCase() || ''

  // Find matching GIF
  const gifMatch = gifExercises.find(g => {
    const gifTitle = g.title?.toLowerCase() || ''
    return gifTitle.includes(normalizedName) ||
           normalizedName.includes(gifTitle) ||
           normalizedName.split(' ').some(word => word.length > 3 && gifTitle.includes(word))
  })

  return {
    id: detailed.id || Math.random().toString(36).substr(2, 9),
    name: detailed.name,
    gifUrl: gifMatch?.gif_url || null,
    bodyPart: detailed.primaryMuscles?.[0] || null,
    target: detailed.primaryMuscles?.[0] || null,
    equipment: detailed.equipment,
    instructions: detailed.instructions || [],
    secondaryMuscles: detailed.secondaryMuscles || [],
    level: detailed.level,
    category: detailed.category
  }
}

export default {
  getBodyParts,
  getEquipmentList,
  getTargetMuscles,
  getExercisesByBodyPart,
  getExercisesByTarget,
  getExercisesByEquipment,
  getExerciseById,
  searchExercises,
  getAllExercises,
  findExerciseGif,
  findExerciseGifs
}
