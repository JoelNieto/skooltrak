export class FetchDataInput {
    skip?: number;

    take?: number;

    orderBy?: string;

    orderDirection: 'asc' | 'desc';

    schoolId?: string;

    search?: string;

    studyPlanId?: string;
}
