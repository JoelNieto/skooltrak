import { Organization } from '../../organizations/entities/organization.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserStudent } from './student.entity';
import { UserTeacher } from './teacher.entity';

export class User {
    id: string;

    role: Role | null;

    color: string | null;

    email: string;

    name: string | null;

    firstName: string;

    lastName: string;

  password: string;

    image: string | null;

    emailVerified: boolean;

    banned: boolean;

    banReason: string | null;

    banExpires: Date | null;

    roleId: string | null;

    organizationId: string | null;

    organization: Organization | null;

    onboardingStep: string | null;

    themePreference: string | null;

    lastLogin: Date | null;

    isBlocked: boolean;

    teacher: UserTeacher | null;

    student: UserStudent | null;

    createdAt: Date;

    updatedAt: Date;
}
