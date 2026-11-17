# Emails to send, 17 November 2026

Nothing here has been sent.

## 1. Reply to LPRS Connected Solutions

They asked on 29 September through `/for-business`: "Water hardness information for use with water filters", 1,000 to 10,000 lookups a month. Their contact name and address are in the `business_enquiries` table (row 2). Send from `hello@tapwater.uk` or your own address.

Before sending, mint their key (prints the key once):

```bash
npx tsx scripts/create-api-key.ts "LPRS Connected Solutions Ltd" <their email> pilot 1000
```

Subject: Water hardness data for LPRS: your pilot key

> Hello {NAME},
>
> You asked us on 29 September about water hardness data for use with water filters. I am sorry it has taken this long: our enquiry alerts were going to a mailbox that was not receiving, which is now fixed.
>
> What you get from one request:
>
> - the measured hardness for any UK postcode district, in mg/L calcium carbonate with the band (soft to very hard), and whether it is a reading for that district or the median for its postcode area
> - the water company, the latest sample date and the other test results against their legal limits
>
> We hold hardness for 2,152 districts. A lookup is one postcode; repeats of the same postcode on the same day are not counted.
>
> Here is a pilot key, free for 90 days at 1,000 lookups a month: {KEY}
>
> ```
> curl -H "x-api-key: {KEY}" "https://www.tapwater.uk/api/v1/report?postcode=RG1"
> ```
>
> After the pilot it is £199 a month for 5,000 lookups or £499 for 50,000, with an embeddable postcode checker included if you would rather not build one.
>
> If you tell me how the filters use the figure (a setting on the device, a recommendation at checkout, something else), I can check the response has what you need before you write any code.
>
> {YOUR NAME}
> TapWater.uk

## 2. Reply to the second enquiry ("BI", 6 November)

"Check hardest regions", under 1,000 lookups a month. Row 3 in `business_enquiries`.

Subject: Hardest water regions: the data you asked about

> Hello {NAME},
>
> You asked on 6 November about checking the hardest water regions. Sorry for the slow reply; our enquiry alerts were not reaching us.
>
> The free route may be all you need: https://www.tapwater.uk/guides/water-hardness-map shows every district, and https://www.tapwater.uk/hardness lists the hardest postcode areas.
>
> If you want it as data, I can send a free 90-day key for 1,000 lookups a month, or a one-off file of every district with its reading. Which would be more use?
>
> {YOUR NAME}
> TapWater.uk

## 3. Harvey: asking for referral terms

You gave permission to email Harvey through the site's mail system. I could not: Harvey publishes no email address. Its contact page has web forms and phone numbers only, and its referral pages give no route for businesses. I did not guess an address.

Ways in: phone 01483 753404 and ask for whoever runs the affiliate referral pages (the ones for Schmidt, Mockford & Hunt and Wright Clean), or paste the message below into the trade enquiry form at https://www.harveywatersofteners.co.uk/dualflo/dualflo-trade-account/.

> I run TapWater.uk, where people look up the measured hardness of their tap water by postcode. Where it is hard they can ask for softener quotes: 21 homeowners did in the last four weeks, most in London and the Home Counties.
>
> I have seen your co-branded referral pages for Schmidt and Mockford & Hunt. I would like the same arrangement for the districts where I have no local installer: a referral page and code for TapWater.uk visitors.
>
> Could you tell me who handles affiliate referrals, and what the terms are for the referring business?
>
> {YOUR NAME}, TapWater.uk, partners@tapwater.uk

Use this only for districts no independent installer covers, so it never competes with the dealers paying for leads.
