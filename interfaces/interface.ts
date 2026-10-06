export interface ResponsibilityItem {
    key: string;
    title: string;
    detail: string;
}

export interface RegistrationRequest {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    studyClass: string;
    course: string;
    yearOfStudy: string;
}

export interface ApprovalCounts {
    waitingForGs: number;
    waitingForVgs: number;
    isAtLimit: boolean;
}