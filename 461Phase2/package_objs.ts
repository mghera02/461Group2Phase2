// This file contains all of the objects for our packages
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
    BusFactor: number;
    RampUp: number;
    LicenseScore: number;
    Correctness: number;
    ResponsiveMaintainer: number;
    PullRequest: number;
    GoodPinningPractice: number;
    NetScore: number;
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
