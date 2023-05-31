import { handleDateFilterParams, verifyAuth, handleAmountFilterParams } from '../controllers/utils';

describe("handleDateFilterParams", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Expect to return an empty object without query params", () => {
        const req={query:{}};
        const result=handleDateFilterParams(req);
        expect(result).toEqual({});
    });
    test("Expect to return an object with 'from' query",()=>{
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
    test("Expect to throw an error if 'date' in wrong format",()=>{
        const req={query:{date: "AA2023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'from' in wrong format",()=>{
        const req={query:{from: "22023-05-10"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
    test("Expect to throw an error if 'upTo' in wrong format",()=>{
        const req={query:{upTo: "10-05-2023"}};
        
        expect(()=>handleDateFilterParams(req)).toThrowError();
    });
})

describe("verifyAuth", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("handleAmountFilterParams", () => { 
    test('Expect empty object if no query params', () => {
        const req={query:{}};

        const result=handleAmountFilterParams(req);
        
        expect(result).toEqual({});
    });
    test("Expect to return an object with 'min' query", ()=>{
        const req={query:{min:"10"}};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$gte).toEqual(10)
    })
    test("Expect to return an object with 'max' query", ()=>{
        const req={query:{max:"50"}};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$lte).toEqual(50)
    })
    test("Expect to return an object with 'min' and 'max' query", ()=>{
        const req={query:{min:"10", max:"50"}};
        const result=handleAmountFilterParams(req);
        expect(result.amount.$gte).toEqual(10);
        expect(result.amount.$lte).toEqual(50);
    })
    test("Expect to throw an error if wrong amount format",()=>{
        const req={query:{min:"A10"}};

        expect(()=>handleAmountFilterParams(req)).toThrowError();
    })
})
