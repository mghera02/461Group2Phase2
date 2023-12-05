
interface Package {
    metadata: PackageMetadata,
    data: PackageData,
}

interface PackageMetadata {
    name: string,
    version: string,
    ID: string,
}

interface PackageData {
    content?: string,
    URL?: string,
    JSProgram?: string,
}

interface PackageRating {
    busFactor: number,
    rampup: number,
    license: number,
    correctness: number,
    maintainer: number,
    pullRequest: number,
    pinning: number,
    score: number,
}

function generate_id(name: string, version: string) {
    return name + version
}

export {
    Package,
    PackageMetadata,
    PackageData,
    PackageRating,
    generate_id,
}
