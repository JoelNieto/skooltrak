export class Invitation {
    id: string;

    email: string;

    inviterId: string;

    organizationId: string;

    role: string;

    status: string;

    expiresAt: Date;

    createdAt: Date;
}

export class Member {
    id: string;

    organizationId: string;

    userId: string;

    role: string;

    createdAt: Date;
}
