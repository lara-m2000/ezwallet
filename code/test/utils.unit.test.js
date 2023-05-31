import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';

describe("handleDateFilterParams", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    // only from
    // only upTo
    // from and upto
    // date
    // date w/ one
    //invalid date
    test("Expect to return an empty object without query params", () => {
        const req={query:{}};
        const result=handleDateFilterParams(req);
        expect(result).toEqual({});
    });
    test("Expect to return an object with 'upTo' query",()=>{
        const req={query:{from: "2023-04-30"}};

        const result=handleDateFilterParams(req);
        
        expect(result.date.$gte).toEqual(new Date("2023-04-30T00:00:00.000Z"));
    });
    test("Expect to return an object with 'upTo' query",()=>{
        const req={query:{upTo: "2023-04-30"}};

        const result=handleDateFilterParams(req);
        
        expect(result.date.$lte).toEqual(new Date("2023-04-30T23:59:59.000Z"));
    });
    test("Expect to return an object with 'from' and 'upTo' query",()=>{
        const req={query:{from: "2023-04-30", upTo:"2023-05-10"}};

        const result=handleDateFilterParams(req);
        
        expect(result.date.$gte).toEqual(new Date("2023-04-30T00:00:00.000Z"));
        expect(result.date.$lte).toEqual(new Date("2023-05-10T23:59:59.000Z"));
    });
    test("Expect to return an object with 'date' query",()=>{
        const req={query:{date: "2023-05-10"}};

        const result=handleDateFilterParams(req);
        
        expect(result).toEqual({date: {
            $gte:new Date("2023-05-10T00:00:00.000Z"), 
            $lte:new Date("2023-05-10T23:59:59.000Z")}
        });
    });
    test("Expect to throw an error if 'date' and 'from' are present",()=>{
        const req={query:{from:"2023-04-30", date: "2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'date' and 'upTo' are present",()=>{
        const req={query:{upTo:"2023-04-30", date: "2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if wrong date format",()=>{
        const req={query:{date: "AA2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
})

describe("verifyAuth", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("handleAmountFilterParams", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
