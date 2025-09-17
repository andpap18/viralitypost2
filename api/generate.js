export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sourceText, tone, outputs } = req.body || {};
    
    console.log("Received request:", { sourceText, tone, outputs });
    
    // Generate content based on tone
    const toneTemplates = {
      casual: {
        instagram: `😊 ${sourceText || "This amazing thing"} is absolutely incredible!\n\n✨ Can't believe how awesome this is! You have to see it to believe it.\n\n#amazing #incredible #awesome #loveit #mustsee #wow #mindblown #gamechanger #trending #viral #fyp #instagood #photooftheday #beautiful #stunning #perfect #best #top #quality #amazing`,
        twitter: `1/3 😊 Just discovered ${sourceText || "something amazing"} and I'm absolutely blown away!\n\nThis is exactly what we needed! 🚀\n\n#amazing #discovery\n\n2/3 The possibilities are endless with this! Can't wait to see what comes next.\n\n#possibilities #future\n\n3/3 Seriously, this changes everything! Who else is excited about this? 🙌\n\n#gamechanger #excited`,
        linkedin: `🚀 Exciting news: ${sourceText || "This innovative solution"} is making waves in our industry!\n\nHere's why this matters:\n\n• Revolutionary approach that's changing the game\n• Real results that speak for themselves\n• Perfect for businesses looking to grow\n• Easy to implement and scale\n• Backed by industry experts\n\nThis is the kind of innovation that drives progress forward.\n\nWhat are your thoughts on this development?\n\n#innovation #business #growth #technology #future #success #leadership #strategy #development #progress`
      },
      professional: {
        instagram: `📈 ${sourceText || "This strategic initiative"} represents a significant advancement in our industry.\n\nOur comprehensive analysis demonstrates measurable improvements across key performance indicators.\n\n#business #strategy #innovation #growth #leadership #success #professional #excellence #results #performance #development #advancement #industry #analysis #metrics #improvement #achievement #progress #quality #standards`,
        twitter: `1/4 📊 Industry analysis reveals ${sourceText || "significant market opportunities"} in the current landscape.\n\nKey findings indicate substantial growth potential.\n\n#business #analysis\n\n2/4 Strategic implementation of these insights can drive measurable ROI improvements.\n\n#strategy #ROI\n\n3/4 Organizations adopting this approach report enhanced operational efficiency.\n\n#efficiency #operations\n\n4/4 The data clearly supports this methodology as a best practice.\n\n#bestpractice #data`,
        linkedin: `📊 Strategic Analysis: ${sourceText || "This comprehensive solution"} delivers measurable business value.\n\nKey Performance Indicators:\n\n• 25% improvement in operational efficiency\n• 40% reduction in implementation costs\n• 60% increase in stakeholder satisfaction\n• 35% faster time-to-market\n• 50% enhancement in quality metrics\n\nOur research demonstrates consistent results across multiple industry verticals.\n\nRecommendation: Immediate implementation for competitive advantage.\n\n#businessstrategy #performance #efficiency #innovation #leadership #growth #analytics #optimization #results #excellence`
      },
      witty: {
        instagram: `😄 ${sourceText || "This brilliant idea"} is so good, it should be illegal! 🚫\n\nSeriously though, why didn't we think of this sooner? It's like the universe finally got its act together! 🌟\n\n#brilliant #genius #mindblown #hilarious #amazing #witty #clever #smart #funny #awesome #incredible #gamechanger #trending #viral #fyp #instagood #photooftheday #beautiful #stunning #perfect #best`,
        twitter: `1/3 😄 ${sourceText || "This idea"} is so brilliant, I'm questioning my life choices! 🤔\n\nWhy didn't I think of this? Oh right, I'm not a genius! 😂\n\n#brilliant #genius #funny\n\n2/3 It's like someone finally read the instruction manual for life! 📖\n\nEverything makes sense now! 🤯\n\n#lifehack #sense\n\n3/3 Plot twist: This was actually invented by aliens who got tired of our primitive ways! 👽\n\n#aliens #plotwist #evolution`,
        linkedin: `😄 Professional Insight: ${sourceText || "This innovative approach"} is so effective, it's almost suspicious! 🕵️‍♂️\n\nHere's the breakdown:\n\n• Results so good, they should come with a warning label\n• Implementation so smooth, it's like butter on hot toast\n• ROI so impressive, your accountant will cry tears of joy\n• Efficiency gains so significant, time itself is confused\n• Innovation so groundbreaking, Newton's laws are taking notes\n\nThis isn't just business improvement - it's business evolution!\n\nWarning: Side effects may include increased productivity and uncontrollable optimism.\n\n#innovation #humor #business #productivity #results #efficiency #growth #leadership #strategy #success`
      },
      inspirational: {
        instagram: `✨ ${sourceText || "This incredible journey"} reminds us that anything is possible when we believe in ourselves! 💫\n\nEvery great achievement starts with a single step forward. Today, we're taking that step together! 🌟\n\n#inspiration #motivation #believe #achieve #dreams #success #positivity #mindset #growth #empowerment #strength #courage #determination #hope #light #shine #bright #future #possibilities #amazing`,
        twitter: `1/4 ✨ ${sourceText || "This moment"} teaches us that greatness lives within each of us.\n\nWe just need to unlock it! 🔓\n\n#greatness #unlock #potential\n\n2/4 Every challenge is an opportunity in disguise.\n\nThis is our opportunity to shine! ⭐\n\n#opportunity #shine #challenge\n\n3/4 Success isn't about perfection - it's about progress.\n\nAnd we're making incredible progress! 🚀\n\n#success #progress #incredible\n\n4/4 Today, we choose to be the change we want to see.\n\nWho's with me? 🙌\n\n#change #choice #together`,
        linkedin: `✨ Leadership Insight: ${sourceText || "This transformative initiative"} embodies the power of human potential.\n\nKey Principles for Success:\n\n• Believe in the impossible until it becomes inevitable\n• Transform challenges into stepping stones for growth\n• Lead with compassion and inspire through action\n• Create value that extends beyond immediate results\n• Build bridges that connect dreams to reality\n\nThis isn't just about achieving goals - it's about becoming the person capable of achieving them.\n\nRemember: The greatest leaders don't just manage change; they inspire transformation.\n\n#leadership #inspiration #transformation #potential #growth #success #empowerment #vision #purpose #impact #legacy #excellence`
      },
      educational: {
        instagram: `📚 Let's break down ${sourceText || "this fascinating concept"} step by step! 🧠\n\nUnderstanding the fundamentals helps us make better decisions and achieve greater success. Knowledge is power! 💪\n\n#education #learning #knowledge #facts #science #research #study #wisdom #intelligence #growth #development #skills #training #expertise #mastery #understanding #insight #analysis #breakdown #tutorial`,
        twitter: `1/4 📚 Quick lesson on ${sourceText || "this important topic"}:\n\nUnderstanding the basics is crucial for success.\n\n#education #basics #success\n\n2/4 Here's what the research shows:\n\nData-driven insights lead to better outcomes.\n\n#research #data #insights\n\n3/4 Practical application:\n\nThese principles work in real-world scenarios.\n\n#practical #application #realworld\n\n4/4 Key takeaway:\n\nKnowledge without action is just information.\n\n#knowledge #action #takeaway`,
        linkedin: `📚 Educational Analysis: ${sourceText || "This comprehensive framework"} provides valuable insights for professional development.\n\nLearning Objectives:\n\n• Master fundamental concepts and their practical applications\n• Develop critical thinking skills for complex problem-solving\n• Understand industry best practices and emerging trends\n• Build expertise through hands-on experience and case studies\n• Apply knowledge to drive measurable business outcomes\n\nThis educational approach combines theoretical knowledge with practical implementation strategies.\n\nContinuous learning is the foundation of professional excellence and career advancement.\n\n#education #learning #professionaldevelopment #skills #knowledge #expertise #growth #career #training #development #excellence`
      }
    };
    
    const selectedTone = toneTemplates[tone] || toneTemplates.casual;
    const selectedOutputs = Array.isArray(outputs) ? outputs : [];
    
    const result = {};
    
    if (selectedOutputs.includes('instagram')) {
      result.instagram = selectedTone.instagram;
    }
    
    if (selectedOutputs.includes('twitter')) {
      result.twitter = selectedTone.twitter;
    }
    
    if (selectedOutputs.includes('linkedin')) {
      result.linkedin = selectedTone.linkedin;
    }
    
    console.log("Generated result:", result);
    
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(result);
    
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
}