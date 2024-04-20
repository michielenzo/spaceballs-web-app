export interface Vec2D {
    x: number
    y: number
}

export function distance2D(pointA: Vec2D, pointB: Vec2D): number {
    // Calculate the difference in x and y coordinates
    const deltaX = pointB.x - pointA.x
    const deltaY = pointB.y - pointA.y

    // Calculate the Euclidean distance using the Pythagorean theorem
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
}

export function directionTowards2D(pointFrom: Vec2D, pointTowards: Vec2D): Vec2D {
    // Calculate the difference vector
    const diffX = pointTowards.x - pointFrom.x
    const diffY = pointTowards.y - pointFrom.y

    // Calculate the magnitude of the vector
    const magnitude = Math.sqrt(diffX * diffX + diffY * diffY)

    // Normalize the vector (make it 1 unit in length)
    const normalizedX = magnitude > 0 ? diffX / magnitude : 0
    const normalizedY = magnitude > 0 ? diffY / magnitude : 0

    return {
        x: normalizedX,
        y: normalizedY
    };
}